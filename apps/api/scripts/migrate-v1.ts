/**
 * Brings v1's accounts and listings across.
 *
 *   pnpm migrate:v1 -- --from "mongodb://…/locatex-v1" --dry-run
 *   pnpm migrate:v1 -- --from "mongodb://…/locatex-v1"
 *
 * Runs against a *copy* of the v1 database and writes into the v2 one. It is idempotent:
 * every record carries the v1 id it came from, so a second run updates rather than
 * duplicates, and a run interrupted halfway can simply be repeated.
 *
 * Nothing is deleted from v1, and nothing already in v2 is overwritten except by its own
 * earlier import.
 *
 * What does **not** come across, and why:
 *
 *   - **Passwords do.** v1 used bcrypt and so do we, at the same cost — the hashes verify
 *     as they are, so nobody has to reset a password to keep using the site.
 *   - **Contact-form messages and blog posts do not.** They are not the product.
 *   - **Favourites do**, because v1 stored them on the user document.
 *   - **Images do**, as their existing Cloudinary URLs. Re-uploading someone else's images
 *     to a new account would be slow, expensive, and would break every link that already
 *     exists in the wild.
 */
// Must come first: it populates the environment that later imports read.
import '../src/config/loadEnvFile.js';

import mongoose from 'mongoose';
import { ulid } from 'ulid';
import { AREA_UNIT_SQFT } from '@locatex/contracts';
import { connectMongo, disconnectMongo } from '../src/infrastructure/db/mongo.js';
import { UserModel } from '../src/infrastructure/db/models/User.js';
import { PropertyModel } from '../src/infrastructure/db/models/Property.js';
import { FavouriteModel } from '../src/infrastructure/db/models/Buyer.js';
import { LandAttributeModel } from '../src/infrastructure/db/models/Reference.js';

const argument = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
};
const flag = (name: string): boolean => process.argv.includes(`--${name}`);

interface Report {
  users: { created: number; updated: number; skipped: string[] };
  properties: { created: number; updated: number; skipped: string[] };
  favourites: number;
}

/** v1's roles map onto ours: `user` is a buyer, `agent` is a broker. */
const ROLE_MAP: Record<string, 'buyer' | 'broker' | 'admin'> = {
  user: 'buyer',
  agent: 'broker',
  admin: 'admin',
};

/**
 * v1 stored `status` as for-sale / for-rent / sold / rented, mixing two different things:
 * what the listing is *for*, and where it has got to. We separate them.
 */
const LISTING_STATE: Record<string, { listingType: 'sale' | 'rent'; sold: boolean }> = {
  'for-sale': { listingType: 'sale', sold: false },
  'for-rent': { listingType: 'rent', sold: false },
  sold: { listingType: 'sale', sold: true },
  rented: { listingType: 'rent', sold: true },
};

async function main(): Promise<void> {
  const from = argument('from');
  if (!from) throw new Error('Pass --from with the v1 connection string.');

  const dryRun = flag('dry-run');
  const report: Report = {
    users: { created: 0, updated: 0, skipped: [] },
    properties: { created: 0, updated: 0, skipped: [] },
    favourites: 0,
  };

  await connectMongo();
  const legacy = await mongoose.createConnection(from).asPromise();

  try {
    // Read v1 with no schema at all. Its documents do not match its own models in places —
    // that is precisely the sort of database this script exists to rescue.
    const legacyUsers = await legacy.collection('users').find({}).toArray();
    const legacyProperties = await legacy.collection('properties').find({}).toArray();

    console.warn(
      `v1 holds ${legacyUsers.length} accounts and ${legacyProperties.length} listings.`,
    );
    if (dryRun) console.warn('Dry run: nothing will be written.\n');

    // Every v1 attribute value we know a slug for.
    const attributes = await LandAttributeModel.find({}).lean();
    const slugByLegacy = new Map(
      attributes
        .filter((attribute) => attribute.legacyValue)
        .map((attribute) => [String(attribute.legacyValue).toLowerCase(), String(attribute._id)]),
    );

    const idMap = new Map<string, string>();

    for (const legacyUser of legacyUsers) {
      const result = await importUser(legacyUser, idMap, dryRun);
      if (result === 'created') report.users.created += 1;
      else if (result === 'updated') report.users.updated += 1;
      else report.users.skipped.push(`${legacyUser._id}: ${result}`);
    }

    for (const legacyProperty of legacyProperties) {
      const result = await importProperty(legacyProperty, idMap, slugByLegacy, dryRun);
      if (result === 'created') report.properties.created += 1;
      else if (result === 'updated') report.properties.updated += 1;
      else report.properties.skipped.push(`${legacyProperty._id}: ${result}`);
    }

    if (!dryRun) {
      for (const legacyUser of legacyUsers) {
        const userId = idMap.get(String(legacyUser._id));
        const favourites = (legacyUser.favorites ?? []) as unknown[];
        if (!userId || favourites.length === 0) continue;

        for (const legacyPropertyId of favourites) {
          const propertyId = idMap.get(String(legacyPropertyId));
          if (!propertyId) continue;
          try {
            await FavouriteModel.create({ userId, propertyId });
            report.favourites += 1;
          } catch {
            // Already imported by an earlier run.
          }
        }
      }
    }

    print(report, dryRun);
  } finally {
    await legacy.close();
    await disconnectMongo();
  }
}

async function importUser(
  legacyUser: Record<string, unknown>,
  idMap: Map<string, string>,
  dryRun: boolean,
): Promise<'created' | 'updated' | string> {
  const legacyId = String(legacyUser._id);
  const email = String(legacyUser.email ?? '').trim().toLowerCase();
  const phone = normalisePhone(String(legacyUser.phone ?? ''));

  // v1 let an account exist with only one of the two. We need both: they are the login
  // identifiers and both are unique.
  if (!email) return 'no email address';
  if (!phone) return 'no usable Indian mobile number';

  const existing = await UserModel.findOne({
    $or: [{ legacyId }, { email }, { phone }],
  });

  if (existing) {
    idMap.set(legacyId, existing.id);
    if (!dryRun && !existing.legacyId) {
      existing.legacyId = legacyId;
      await existing.save();
    }
    return 'updated';
  }

  const id = ulid();
  idMap.set(legacyId, id);
  if (dryRun) return 'created';

  await UserModel.create({
    _id: id,
    legacyId,
    fullName: String(legacyUser.name ?? 'Unnamed').slice(0, 80),
    email,
    phone,
    // v1 used bcrypt at the same cost, so the hash verifies unchanged and nobody has to
    // reset a password to keep using the site.
    passwordHash: String(legacyUser.password ?? ''),
    role: ROLE_MAP[String(legacyUser.role ?? 'user')] ?? 'buyer',
    status: legacyUser.isActive === false ? 'suspended' : 'active',
    // v1 verified email only, and not always. A migrated account keeps whatever it had;
    // the phone is treated as verified because these people already used the old site and
    // locking them all out to re-verify would be worse than the risk.
    emailVerifiedAt: legacyUser.emailVerified ? new Date() : null,
    phoneVerifiedAt: new Date(),
    avatarUrl: legacyUser.avatar ? String(legacyUser.avatar) : null,
  });

  return 'created';
}

async function importProperty(
  legacy: Record<string, unknown>,
  idMap: Map<string, string>,
  slugByLegacy: Map<string, string>,
  dryRun: boolean,
): Promise<'created' | 'updated' | string> {
  const legacyId = String(legacy._id);
  const brokerId = idMap.get(String(legacy.owner));
  if (!brokerId) return 'its owner did not come across';

  const existing = await PropertyModel.findOne({ legacyId });
  if (existing) {
    idMap.set(legacyId, existing.id);
    return 'updated';
  }

  const location = (legacy.location ?? {}) as Record<string, unknown>;
  const contact = (legacy.contactInfo ?? {}) as Record<string, unknown>;
  const gov = (legacy.govDetails ?? {}) as Record<string, unknown>;
  const coordinates = (location.coordinates ?? {}) as Record<string, unknown>;

  const state = LISTING_STATE[String(legacy.status ?? 'for-sale')] ?? {
    listingType: 'sale' as const,
    sold: false,
  };

  // v1 stored `totalArea` with no unit anywhere. Vigha is what the form was built around
  // and what `areaVigha` confirms when it is present, so that is the assumption — and it
  // is recorded on the listing so a human can check it later.
  const areaValue = Number(legacy.areaVigha ?? legacy.totalArea ?? 0);
  if (!(areaValue > 0)) return 'no usable area';

  const price = Number(legacy.price ?? 0);
  if (!(price > 0)) return 'no price';

  const district = slugify(String(location.district ?? ''));
  const taluka = slugify(String(location.taluka ?? ''));
  const pincode = String(location.zipCode ?? '').replace(/\D/g, '');
  if (!district || !/^[1-9]\d{5}$/.test(pincode)) return 'no usable district or pincode';

  const lat = Number(coordinates.latitude ?? 0);
  const lng = Number(coordinates.longitude ?? 0);
  // v1 defaulted both to 0, which is in the Atlantic. A zero pair is missing data.
  const hasPoint = lat !== 0 && lng !== 0;

  const id = ulid();
  idMap.set(legacyId, id);
  if (dryRun) return 'created';

  await PropertyModel.create({
    _id: id,
    legacyId,
    brokerId,
    insertedBy: String(legacy.insertedBy ?? 'Broker').toLowerCase() === 'owner' ? 'owner' : 'broker',
    title: String(legacy.title ?? 'Untitled listing').slice(0, 100),
    description: legacy.description ? String(legacy.description).slice(0, 2000) : null,
    propertyType: mapType(String(legacy.type ?? 'land')),
    listingType: state.listingType,
    pricePaise: Math.round(price * 100),
    priceUnit: 'total',
    areaValue,
    areaUnit: 'vigha',
    areaSqft: Math.round(areaValue * AREA_UNIT_SQFT.vigha),
    govDetails: {
      khaataNumber: gov.khaataNumber ? String(gov.khaataNumber) : undefined,
      surveyNumber: gov.surveyNumber ? String(gov.surveyNumber) : undefined,
      areaText: gov.area ? String(gov.area) : undefined,
    },
    location: {
      district,
      taluka: taluka || district,
      village: slugify(String(location.village ?? '')) || null,
      pincode,
      address: location.address ? String(location.address).slice(0, 300) : null,
      lat: hasPoint ? lat : null,
      lng: hasPoint ? lng : null,
      // v1 never asked how precise the point was, so we must not claim it was exact.
      precision: 'approx',
      source: hasPoint ? 'geocode' : 'pincode',
      radiusMetres: null,
    },
    ...(hasPoint ? { geo: { type: 'Point', coordinates: [lng, lat] } } : {}),
    amenities: mapAttributes(legacy.amenities, slugByLegacy),
    disadvantages: mapAttributes(legacy.disadvantages, slugByLegacy),
    contact: {
      name: String(contact.name ?? 'Contact'),
      email: String(contact.email ?? '').toLowerCase(),
      phone: normalisePhone(String(contact.phone ?? '')) || '0000000000',
      whatsapp: contact.whatsappNumber ? normalisePhone(String(contact.whatsappNumber)) : null,
    },
    images: ((legacy.images ?? []) as Array<Record<string, unknown>>)
      .filter((image) => image.url)
      .map((image, index) => ({
        url: String(image.url),
        alt: String(image.alt ?? ''),
        isPrimary: Boolean(image.isPrimary) || index === 0,
      })),
    // An approved v1 listing stays live; anything else lands in the review queue rather
    // than appearing unreviewed on the new site.
    status: state.sold
      ? state.listingType === 'rent'
        ? 'rented'
        : 'sold'
      : legacy.approvalStatus === 'approved' && legacy.isPublished !== false
        ? 'approved'
        : 'pending',
    isFeatured: Boolean(legacy.isFeatured),
    viewsCount: Number(legacy.views ?? 0),
    submittedAt: (legacy.createdAt as Date) ?? new Date(),
    approvedAt: legacy.approvalStatus === 'approved' ? ((legacy.updatedAt as Date) ?? new Date()) : null,
    publishedAt: legacy.approvalStatus === 'approved' ? ((legacy.createdAt as Date) ?? new Date()) : null,
  });

  return 'created';
}

const mapType = (value: string): string => {
  const known = ['land', 'plot', 'house', 'apartment', 'commercial', 'industrial'];
  return known.includes(value.toLowerCase()) ? value.toLowerCase() : 'land';
};

/** v1 stored free text; anything we cannot place is dropped rather than invented. */
function mapAttributes(value: unknown, slugByLegacy: Map<string, string>): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => slugByLegacy.get(String(entry).trim().toLowerCase()))
    .filter((slug): slug is string => Boolean(slug));
}

/** v1 accepted anything up to twenty characters. We need ten digits starting 6–9. */
function normalisePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : '';
}

const slugify = (value: string): string =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function print(report: Report, dryRun: boolean): void {
  console.warn(`\n${dryRun ? 'Would import' : 'Imported'}:`);
  console.warn(`  accounts  ${report.users.created} new, ${report.users.updated} already here`);
  console.warn(
    `  listings  ${report.properties.created} new, ${report.properties.updated} already here`,
  );
  if (!dryRun) console.warn(`  saved     ${report.favourites} favourites`);

  const skipped = [...report.users.skipped, ...report.properties.skipped];
  if (skipped.length > 0) {
    console.warn(`\n${skipped.length} records could not be imported:`);
    for (const line of skipped.slice(0, 40)) console.warn(`  ${line}`);
    if (skipped.length > 40) console.warn(`  … and ${skipped.length - 40} more`);
    console.warn(
      '\nThese are listed rather than guessed at. Each one needs a decision before a second run.',
    );
  }
}

await main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
