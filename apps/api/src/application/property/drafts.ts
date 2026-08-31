import {
  completedSteps,
  createPropertySchema,
  draftSaveSchema,
  isDraftComplete,
  propertyDraftDataSchema,
  type PropertyDraftData,
} from '@locatex/contracts';
import {
  PropertyDraftModel,
  type PropertyDraftDoc,
} from '../../infrastructure/db/models/PropertyDraft.js';
import { PropertyModel, type PropertyDoc } from '../../infrastructure/db/models/Property.js';
import { createProperty, updateProperty } from './writeProperty.js';
import type { StatusActor } from '../../domain/property/status.js';
import { AppError } from '../../shared/AppError.js';

/**
 * Autosave, resume, and turning a finished draft into a listing.
 *
 * The draft holds the form in the same shape the create endpoint accepts, so completing it
 * is a parse and a handover rather than a field-by-field translation — which is what keeps
 * the wizard from becoming a second, subtly different definition of a listing.
 */

const MAX_OPEN_DRAFTS = 20;

export async function listDrafts(brokerId: string): Promise<PropertyDraftDoc[]> {
  return PropertyDraftModel.find({ brokerId }).sort({ updatedAt: -1 }).limit(50);
}

export async function startDraft(
  brokerId: string,
  propertyId?: string,
): Promise<PropertyDraftDoc> {
  const open = await PropertyDraftModel.countDocuments({ brokerId });
  if (open >= MAX_OPEN_DRAFTS) {
    throw new AppError(
      'CONFLICT',
      `You have ${open} unfinished drafts. Finish or delete one before starting another.`,
    );
  }

  // Editing an existing listing: the wizard opens on its current contents, so a broker
  // correcting a rejection sees what the administrator saw rather than a blank form.
  if (propertyId) {
    const property = await PropertyModel.findOne({ _id: propertyId, deletedAt: null }).lean();
    if (!property) throw AppError.notFound('Listing');
    if (property.brokerId !== brokerId) {
      throw new AppError('NOT_OWNER', 'This listing belongs to another broker.');
    }

    const existing = await PropertyDraftModel.findOne({ brokerId, propertyId });
    if (existing) return existing;

    return PropertyDraftModel.create({
      brokerId,
      propertyId,
      step: 'basics',
      data: draftDataFromProperty(property),
    });
  }

  return PropertyDraftModel.create({ brokerId, step: 'basics', data: {} });
}

/**
 * A draft belongs to the broker writing it, and to nobody else — administrators included.
 *
 * `actorFor` grants an admin the same rights as an owner everywhere else, which is right
 * for a *listing*: an admin reviews, approves and withdraws them. A draft has not been
 * submitted to anybody. It is a half-written form, and there is no administrative task that
 * needs to read one. "The site owner can read what I have not sent yet" is not a promise
 * worth making to the brokers this marketplace depends on.
 */
export async function getDraft(draftId: string, user: StatusActor): Promise<PropertyDraftDoc> {
  const draft = await PropertyDraftModel.findById(draftId);
  if (!draft) throw AppError.notFound('Draft');
  if (draft.brokerId !== user.id) {
    throw new AppError('NOT_OWNER', 'That draft belongs to another broker.');
  }
  return draft;
}

/**
 * One autosave.
 *
 * The incoming keys are merged over the stored ones rather than replacing them wholesale:
 * the wizard saves the step it is on, and a request that arrives out of order — which
 * happens on a slow phone — must not erase the four steps it said nothing about.
 */
export async function saveDraft(
  draftId: string,
  user: StatusActor,
  body: unknown,
): Promise<PropertyDraftDoc> {
  const { step, data } = draftSaveSchema.parse(body);
  const draft = await getDraft(draftId, user);

  const merged = propertyDraftDataSchema.parse({
    ...(draft.data as PropertyDraftData),
    ...data,
  });

  draft.data = merged;
  if (step) draft.step = step;
  draft.lastSavedAt = new Date();
  await draft.save();

  return draft;
}

export async function deleteDraft(draftId: string, user: StatusActor): Promise<void> {
  const draft = await getDraft(draftId, user);
  await draft.deleteOne();
}

/**
 * Finish: the draft becomes a real listing, and stops being a draft.
 *
 * The full schema runs here, not the lenient draft one — a wizard that let someone reach
 * step five without a price would otherwise produce a listing without a price.
 */
export async function completeDraft(
  draftId: string,
  user: StatusActor,
): Promise<PropertyDoc> {
  const draft = await getDraft(draftId, user);
  const data = draft.data as PropertyDraftData;

  if (!isDraftComplete(data)) {
    const unfinished = Object.entries(completedSteps(data))
      .filter(([, done]) => !done)
      .map(([step]) => step);

    throw new AppError(
      'PROPERTY_NOT_SUBMITTABLE',
      `This listing is not finished yet: ${unfinished.join(', ')}.`,
    );
  }

  const input = createPropertySchema.parse(data);

  const property = draft.propertyId
    ? await updateProperty(draft.propertyId, user, input)
    : await createProperty(draft.brokerId, input);

  // The photographs uploaded while drafting are already in Drive; re-point them rather
  // than asking the broker to upload the same eight files again.
  const { adoptDraftDocuments } = await import('../documents/documents.js');
  await adoptDraftDocuments(draft.id, property.id);

  await draft.deleteOne();
  return property;
}

/** Reopening a listing in the wizard: its stored fields, in the shape the form expects. */
function draftDataFromProperty(property: {
  title: string;
  description?: string | null;
  propertyType: string;
  listingType: string;
  insertedBy: string;
  pricePaise: number;
  priceUnit: string;
  areaValue: number;
  areaUnit: string;
  govDetails?: { khaataNumber?: string | null; surveyNumber?: string | null; areaText?: string | null } | null;
  location: Record<string, unknown>;
  amenities?: string[];
  disadvantages?: string[];
  contact: { name: string; email: string; phone: string; whatsapp?: string | null };
  images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
}): PropertyDraftData {
  return propertyDraftDataSchema.parse({
    title: property.title,
    ...(property.description ? { description: property.description } : {}),
    propertyType: property.propertyType,
    listingType: property.listingType,
    insertedBy: property.insertedBy,
    pricePaise: property.pricePaise,
    priceUnit: property.priceUnit,
    area: { value: property.areaValue, unit: property.areaUnit },
    ...(property.govDetails ? { govDetails: dropNulls(property.govDetails) } : {}),
    location: dropNulls({
      district: property.location.district,
      taluka: property.location.taluka,
      village: property.location.village,
      pincode: property.location.pincode,
      address: property.location.address,
      lat: property.location.lat,
      lng: property.location.lng,
      precision: property.location.precision,
      source: property.location.source,
    }),
    amenities: property.amenities ?? [],
    disadvantages: property.disadvantages ?? [],
    contact: dropNulls(property.contact),
    images: (property.images ?? []).map((image) => ({
      url: image.url,
      alt: image.alt ?? '',
      isPrimary: image.isPrimary ?? false,
    })),
  });
}

/** Mongo stores "absent" as null; the draft schema spells it as an omitted key. */
const dropNulls = <T extends Record<string, unknown>>(value: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry != null),
  ) as Partial<T>;
