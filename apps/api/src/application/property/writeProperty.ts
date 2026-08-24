import {
  FREELY_EDITABLE_STATUSES,
  POST_APPROVAL_EDITABLE,
  createPropertySchema,
  updatePropertySchema,
  type AreaUnit,
  type CreatePropertyInput,
  type PropertyStatus,
  type UpdatePropertyInput,
} from '@locatex/contracts';
import mongoose from 'mongoose';
import {
  DistrictModel,
  LandAttributeModel,
  PincodeModel,
  TalukaModel,
  VillageModel,
} from '../../infrastructure/db/models/Reference.js';
import { PropertyModel, type PropertyDoc } from '../../infrastructure/db/models/Property.js';
import { resolvePincode } from '../../infrastructure/geo/pincodeLocation.js';
import { canonicalSqft } from '../../domain/property/serialize.js';
import { actorFor, type StatusActor } from '../../domain/property/status.js';
import { geocoder } from '../../container.js';
import { AppError } from '../../shared/AppError.js';

/**
 * Creating and editing a listing.
 *
 * Two things are enforced here that the schema cannot: every reference value has to exist
 * (a district slug is only meaningful if Phase 3 seeded it), and the location has to be
 * resolved to a point before the listing can appear on a map. Both would otherwise fail
 * silently and produce a listing that is invisible to search.
 */

export async function createProperty(
  brokerId: string,
  input: CreatePropertyInput,
): Promise<PropertyDoc> {
  const data = createPropertySchema.parse(input);
  await assertReferencesExist(data);

  const location = await resolveLocation(data.location);

  return PropertyModel.create({
    brokerId,
    insertedBy: data.insertedBy,
    title: data.title,
    description: data.description ?? null,
    propertyType: data.propertyType,
    listingType: data.listingType,
    pricePaise: data.pricePaise,
    priceUnit: data.priceUnit,
    areaValue: data.area.value,
    areaUnit: data.area.unit,
    areaSqft: canonicalSqft(data.area.value, data.area.unit as AreaUnit),
    govDetails: data.govDetails ?? {},
    location,
    geo: geoPoint(location.lat, location.lng),
    amenities: data.amenities,
    disadvantages: data.disadvantages,
    contact: data.contact,
    images: normaliseImages(data.images),
    status: 'draft',
  });
}

export async function updateProperty(
  propertyId: string,
  user: StatusActor,
  input: UpdatePropertyInput,
): Promise<PropertyDoc> {
  const data = updatePropertySchema.parse(input);
  const property = await PropertyModel.findOne({ _id: propertyId, deletedAt: null });
  if (!property) throw AppError.notFound('Listing');

  if (!actorFor(property, user)) {
    throw new AppError('NOT_OWNER', 'This listing belongs to another broker.');
  }

  assertEditable(property.status as PropertyStatus, data, user);
  await assertReferencesExist(data);

  if (data.title !== undefined) property.title = data.title;
  if (data.description !== undefined) property.description = data.description ?? null;
  if (data.propertyType !== undefined) property.propertyType = data.propertyType;
  if (data.listingType !== undefined) property.listingType = data.listingType;
  if (data.pricePaise !== undefined) property.pricePaise = data.pricePaise;
  if (data.priceUnit !== undefined) property.priceUnit = data.priceUnit;
  if (data.insertedBy !== undefined) property.insertedBy = data.insertedBy;
  if (data.contact !== undefined) property.set('contact', data.contact);
  if (data.images !== undefined) property.set('images', normaliseImages(data.images));
  if (data.amenities !== undefined) property.set('amenities', data.amenities);
  if (data.disadvantages !== undefined) property.set('disadvantages', data.disadvantages);
  if (data.govDetails !== undefined) property.set('govDetails', data.govDetails);

  if (data.area !== undefined) {
    property.areaValue = data.area.value;
    property.areaUnit = data.area.unit;
    property.areaSqft = canonicalSqft(data.area.value, data.area.unit as AreaUnit);
  }

  if (data.location !== undefined) {
    const location = await resolveLocation(data.location);
    property.set('location', location);
    property.set('geo', geoPoint(location.lat, location.lng));
  }

  await property.save();
  return property;
}

/**
 * Edit rules by status. A live listing keeps its price and words editable — prices move,
 * and forcing a fresh review for a price cut would only teach brokers to delete and repost
 * — but everything an administrator actually reviewed is frozen until it goes back in the
 * queue. An admin is not exempt: an admin quietly editing a reviewed survey number is the
 * change nobody would ever find.
 */
function assertEditable(
  status: PropertyStatus,
  data: UpdatePropertyInput,
  user: StatusActor,
): void {
  if (FREELY_EDITABLE_STATUSES.includes(status)) return;

  const editable = new Set<string>(POST_APPROVAL_EDITABLE);
  const blocked = Object.keys(data).filter((field) => !editable.has(field));
  if (blocked.length === 0) return;

  throw new AppError(
    'INVALID_STATE_TRANSITION',
    user.role === 'admin'
      ? `Withdraw the listing before changing ${blocked.join(', ')} — a reviewed listing must be reviewed again.`
      : `A listing that is ${status} can only have its price, description, photos and contact changed. Withdraw it first to change ${blocked.join(', ')}.`,
  );
}

/** Reference slugs are foreign keys in everything but name; Mongo will not check them. */
async function assertReferencesExist(
  data: Partial<CreatePropertyInput>,
): Promise<void> {
  const problems: Array<{ field: string; code: string; message: string }> = [];

  if (data.location) {
    const { district, taluka, village, pincode } = data.location;

    const [districtRow, talukaRow, pincodeRow] = await Promise.all([
      DistrictModel.exists({ _id: district }),
      TalukaModel.exists({ districtSlug: district, slug: taluka }),
      PincodeModel.exists({ _id: pincode }),
    ]);

    if (!districtRow) {
      problems.push({ field: 'location.district', code: 'unknown', message: 'Choose a Gujarat district from the list.' });
    } else if (!talukaRow) {
      problems.push({ field: 'location.taluka', code: 'unknown', message: 'That taluka is not in the chosen district.' });
    }

    if (village) {
      const villageRow = await VillageModel.exists({
        districtSlug: district,
        talukaSlug: taluka,
        slug: village,
      });
      if (!villageRow) {
        problems.push({ field: 'location.village', code: 'unknown', message: 'That village is not in the chosen taluka.' });
      }
    }

    if (!pincodeRow) {
      problems.push({ field: 'location.pincode', code: 'unknown', message: 'We have no record of that pincode in Gujarat.' });
    }
  }

  const slugs = [...(data.amenities ?? []), ...(data.disadvantages ?? [])];
  if (slugs.length > 0) {
    // `mongoose.trusted` because `sanitizeFilter` is on globally and would otherwise
    // rewrite our own `$in` into a literal comparison — see searchProperties.ts.
    const known = await LandAttributeModel.find({
      _id: mongoose.trusted({ $in: slugs }),
      isActive: true,
    })
      .select('_id')
      .lean();
    const knownSet = new Set(known.map((row) => String(row._id)));
    const unknown = slugs.filter((slug) => !knownSet.has(slug));
    if (unknown.length > 0) {
      problems.push({
        field: 'amenities',
        code: 'unknown',
        message: `Not something we recognise: ${unknown.join(', ')}`,
      });
    }
  }

  if (problems.length > 0) throw AppError.validation(problems);
}

/**
 * Turns what the broker chose into a point on a map.
 *
 * An exact pin is taken as given. An approximate location falls back through village, then
 * pincode: the pincode centroid is resolved by Phase 3 from a geocoder that reports a
 * bounding box, so the circle drawn around it has a measured radius rather than a guessed
 * one. A listing whose pincode has never resolved is still accepted — it simply has no
 * point yet, and will not appear in a radius search until one exists.
 */
async function resolveLocation(input: CreatePropertyInput['location']) {
  if (input.precision === 'exact') {
    return {
      district: input.district,
      taluka: input.taluka,
      village: input.village ?? null,
      pincode: input.pincode,
      address: input.address ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      precision: 'exact' as const,
      source: 'pin' as const,
      radiusMetres: 0,
    };
  }

  // The broker may still have dropped a rough pin; honour it rather than overriding.
  if (input.lat != null && input.lng != null) {
    return {
      district: input.district,
      taluka: input.taluka,
      village: input.village ?? null,
      pincode: input.pincode,
      address: input.address ?? null,
      lat: input.lat,
      lng: input.lng,
      precision: 'approx' as const,
      source: input.source,
      radiusMetres: null,
    };
  }

  const resolved = await resolvePincode(input.pincode, geocoder());

  return {
    district: input.district,
    taluka: input.taluka,
    village: input.village ?? null,
    pincode: input.pincode,
    address: input.address ?? null,
    lat: resolved?.lat ?? null,
    lng: resolved?.lng ?? null,
    precision: 'approx' as const,
    source: resolved ? ('pincode' as const) : input.source,
    radiusMetres: resolved?.radiusMetres ?? null,
  };
}

/** GeoJSON order is `[longitude, latitude]`; deriving it here keeps that in one place. */
function geoPoint(lat: number | null, lng: number | null) {
  if (lat == null || lng == null) return undefined;
  return { type: 'Point' as const, coordinates: [lng, lat] };
}

/** Exactly one primary image: the first one flagged, or the first one there is. */
function normaliseImages(images: CreatePropertyInput['images']) {
  if (images.length === 0) return [];
  const primaryIndex = Math.max(
    0,
    images.findIndex((image) => image.isPrimary),
  );
  return images.map((image, index) => ({
    url: image.url,
    alt: image.alt,
    isPrimary: index === primaryIndex,
  }));
}
