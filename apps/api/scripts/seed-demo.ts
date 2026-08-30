// Must come first: it populates the environment that later imports read.
import '../src/config/loadEnvFile.js';

/**
 * A working demonstration: three accounts, and live listings across Gujarat.
 *
 *   pnpm seed:demo
 *   pnpm seed:demo -- --reset      # clear the demo data and put it back
 *
 * This exists so a client can be shown the product rather than an empty shell. An empty
 * marketplace demonstrates nothing — the map is blank, search returns nothing, and the
 * review queue looks broken rather than clear.
 *
 * Everything it creates is marked `isDemo`, so `--reset` can remove exactly what it added
 * and nothing a real user has done. It refuses to touch accounts it did not create.
 */
import mongoose from 'mongoose';
import { ulid } from 'ulid';
import { AREA_UNIT_SQFT } from '@locatex/contracts';
import { connectMongo, disconnectMongo } from '../src/infrastructure/db/mongo.js';
import { UserModel } from '../src/infrastructure/db/models/User.js';
import { PropertyModel } from '../src/infrastructure/db/models/Property.js';
import { hashPassword } from '../src/infrastructure/auth/password.js';

const flag = (name: string): boolean => process.argv.includes(`--${name}`);

const PASSWORD = process.env.DEMO_PASSWORD ?? 'locatex-demo-2026';

/** The three roles, so each can be signed into during a demonstration. */
const PEOPLE = [
  {
    key: 'admin',
    fullName: 'Priya Mehta',
    email: 'admin@locatex.in',
    phone: '9990000001',
    role: 'admin' as const,
  },
  {
    key: 'broker',
    fullName: 'Rameshbhai Patel',
    email: 'broker@locatex.in',
    phone: '9990000002',
    role: 'broker' as const,
    brokerProfile: {
      agencyName: 'Patel Land Associates',
      officeAddress: 'Shop 4, Sanala Road, Morbi, Gujarat 363641',
      district: 'Morbi',
      reraNumber: 'GJ/RERA/1234',
      experienceYears: 12,
      about:
        'Third-generation land broker working across Morbi and Rajkot. Mostly agricultural ' +
        'parcels with canal or borewell water.',
    },
  },
  {
    key: 'buyer',
    fullName: 'Kiran Shah',
    email: 'buyer@locatex.in',
    phone: '9990000003',
    role: 'buyer' as const,
  },
];

/**
 * Real places, with coordinates that are genuinely where they say they are.
 *
 * Invented coordinates would put pins in the Arabian Sea and make the map look broken,
 * which is the opposite of the point. Prices are monthly rents in paise, at rates that are
 * plausible for the district rather than round numbers.
 */
const LISTINGS = [
  {
    title: 'Canal-touch farmland on the Sanala road',
    description:
      'Level black-soil parcel with canal water on two sides and a kachcha approach road ' +
      'from the highway. Currently under cotton. Electricity connection in place.',
    propertyType: 'land',
    pricePaise: 45_000_00,
    areaValue: 12,
    areaUnit: 'vigha',
    district: 'morbi',
    taluka: 'morbi',
    pincode: '363641',
    lat: 22.8117,
    lng: 70.8319,
    amenities: ['fencing', 'electricity', 'water-canal', 'soil-black'],
    disadvantages: [],
    survey: '144/2',
    featured: true,
  },
  {
    title: 'Borewell-fed land near Wankaner',
    description:
      'Two borewells, both working through summer. Fenced on three sides. Suitable for ' +
      'groundnut and cotton. Owner willing to lease for three years or more.',
    propertyType: 'land',
    pricePaise: 32_000_00,
    areaValue: 8,
    areaUnit: 'vigha',
    district: 'morbi',
    taluka: 'wankaner',
    pincode: '363621',
    lat: 22.6134,
    lng: 70.9421,
    amenities: ['fencing', 'electricity', 'kuvo'],
    disadvantages: ['passing-vijpool'],
    survey: '85/2',
    featured: false,
  },
  {
    title: 'NA plot on the Rajkot ring road',
    description:
      'Non-agricultural plot with clear frontage on the ring road. Suitable for a godown ' +
      'or a workshop. All approvals in order.',
    propertyType: 'plot',
    pricePaise: 85_000_00,
    areaValue: 2200,
    areaUnit: 'gaj',
    district: 'rajkot',
    taluka: 'rajkot',
    pincode: '360001',
    lat: 22.3039,
    lng: 70.8022,
    amenities: ['road-pakka', 'electricity'],
    disadvantages: [],
    survey: '412/1',
    featured: true,
  },
  {
    title: 'Irrigated parcel outside Gondal',
    description:
      'Drip irrigation already laid. Two crops a year for the last six seasons. Pakka road ' +
      'up to the boundary.',
    propertyType: 'land',
    pricePaise: 58_000_00,
    areaValue: 15,
    areaUnit: 'vigha',
    district: 'rajkot',
    taluka: 'gondal',
    pincode: '360311',
    lat: 21.9611,
    lng: 70.8017,
    amenities: ['underground-pipeline', 'electricity', 'road-pakka'],
    disadvantages: [],
    survey: '77',
    featured: false,
  },
  {
    title: 'Roadside land near Bhavnagar',
    description:
      'Frontage on the state highway, well suited to a nursery or a storage yard. Water ' +
      'from a shared well.',
    propertyType: 'land',
    pricePaise: 38_000_00,
    areaValue: 6,
    areaUnit: 'vigha',
    district: 'bhavnagar',
    taluka: 'bhavnagar',
    pincode: '364001',
    lat: 21.7645,
    lng: 72.1519,
    amenities: ['road-pakka', 'kuvo'],
    disadvantages: ['borewell-well'],
    survey: '23/4',
    featured: false,
  },
  {
    title: 'Farmland with a farmhouse near Junagadh',
    description:
      'Mature mango trees along the boundary and a two-room structure on the land. Water ' +
      'from a kuvo that has never run dry.',
    propertyType: 'land',
    pricePaise: 52_000_00,
    areaValue: 10,
    areaUnit: 'vigha',
    district: 'junagadh',
    taluka: 'junagadh',
    pincode: '362001',
    lat: 21.5222,
    lng: 70.4579,
    amenities: ['house-on-land', 'kuvo', 'fencing'],
    disadvantages: [],
    survey: '301',
    featured: false,
  },
  {
    title: 'Cotton land in Amreli district',
    description:
      'Open parcel with a shared borewell and an approach through the neighbouring field. ' +
      'Priced to reflect the access.',
    propertyType: 'land',
    pricePaise: 24_000_00,
    areaValue: 9,
    areaUnit: 'vigha',
    district: 'amreli',
    taluka: 'amreli',
    pincode: '365601',
    lat: 21.6032,
    lng: 71.2221,
    amenities: ['electricity'],
    disadvantages: ['borewell-well', 'passing-canal'],
    survey: '58/1',
    featured: false,
  },
  {
    title: 'Plot near the Surat outer ring',
    description:
      'NA plot in a developing stretch, with a compound wall on two sides and drainage in ' +
      'place along the road.',
    propertyType: 'plot',
    pricePaise: 95_000_00,
    areaValue: 3000,
    areaUnit: 'gaj',
    district: 'surat',
    taluka: 'surat-city',
    pincode: '395003',
    lat: 21.1702,
    lng: 72.8311,
    amenities: ['road-pakka', 'electricity', 'fencing-barbed'],
    disadvantages: [],
    survey: '190/3',
    featured: true,
  },
];

async function main(): Promise<void> {
  await connectMongo();

  try {
    if (flag('reset')) {
      const { deletedCount: listings } = await PropertyModel.deleteMany({ isDemo: true });
      const { deletedCount: people } = await UserModel.deleteMany({ isDemo: true });
      console.warn(`removed ${listings} demo listings and ${people} demo accounts.`);
    }

    const passwordHash = await hashPassword(PASSWORD);
    const now = new Date();
    const ids: Record<string, string> = {};

    for (const person of PEOPLE) {
      const existing = await UserModel.findOne({ email: person.email });
      if (existing) {
        ids[person.key] = existing.id;
        continue;
      }

      const created = await UserModel.create({
        _id: ulid(),
        isDemo: true,
        fullName: person.fullName,
        email: person.email,
        phone: person.phone,
        passwordHash,
        role: person.role,
        status: 'active',
        // Verified on creation: there is no inbox or handset behind a demonstration
        // account, and an account that cannot sign in demonstrates nothing.
        emailVerifiedAt: now,
        phoneVerifiedAt: now,
        ...(person.brokerProfile
          ? {
              brokerProfile: { ...person.brokerProfile, approvedAt: now, approvedBy: 'demo' },
              brokerApplication: {
                ...person.brokerProfile,
                status: 'approved',
                submittedAt: now,
                decidedAt: now,
                decidedBy: 'demo',
              },
            }
          : {}),
      });
      ids[person.key] = created.id;
    }

    const brokerId = ids.broker as string;
    let created = 0;

    for (const [index, listing] of LISTINGS.entries()) {
      const title = listing.title;
      if (await PropertyModel.exists({ title, brokerId })) continue;

      // The last two are left waiting so the review queue has something in it — an admin
      // demonstration of an empty queue shows nothing at all.
      const pending = index >= LISTINGS.length - 2;

      await PropertyModel.create({
        _id: ulid(),
        isDemo: true,
        brokerId,
        insertedBy: 'broker',
        title,
        description: listing.description,
        propertyType: listing.propertyType,
        listingType: 'rent',
        pricePaise: listing.pricePaise,
        priceUnit: 'total',
        areaValue: listing.areaValue,
        areaUnit: listing.areaUnit,
        areaSqft: Math.round(
          listing.areaValue * AREA_UNIT_SQFT[listing.areaUnit as keyof typeof AREA_UNIT_SQFT],
        ),
        govDetails: { surveyNumber: listing.survey, khaataNumber: String(400 + index) },
        location: {
          district: listing.district,
          taluka: listing.taluka,
          village: null,
          pincode: listing.pincode,
          address: null,
          lat: listing.lat,
          lng: listing.lng,
          // Approximate, like almost every real listing — and it means the demonstration
          // shows the circle a visitor actually sees rather than a pin they never would.
          precision: 'approx',
          source: 'pincode',
          radiusMetres: 6_000,
        },
        geo: { type: 'Point', coordinates: [listing.lng, listing.lat] },
        amenities: listing.amenities,
        disadvantages: listing.disadvantages,
        contact: {
          name: 'Rameshbhai Patel',
          email: 'broker@locatex.in',
          phone: '9990000002',
          whatsapp: '9990000002',
        },
        images: [],
        status: pending ? 'pending' : 'approved',
        isFeatured: listing.featured && !pending,
        viewsCount: pending ? 0 : 40 + index * 17,
        submittedAt: now,
        approvedAt: pending ? null : now,
        publishedAt: pending ? null : now,
        statusHistory: [
          { from: 'draft', to: 'pending', action: 'submit', byUserId: brokerId, byRole: 'broker', at: now },
          ...(pending
            ? []
            : [{ from: 'pending', to: 'approved', action: 'approve', byUserId: ids.admin as string, byRole: 'admin', at: now }]),
        ],
      });
      created += 1;
    }

    const live = await PropertyModel.countDocuments({ status: 'approved' });
    const waiting = await PropertyModel.countDocuments({ status: 'pending' });

    console.warn(`\n${created} listings added. ${live} live, ${waiting} waiting for review.\n`);
    console.warn('Sign in with any of these — the password is the same for all three:\n');
    for (const person of PEOPLE) {
      console.warn(`  ${person.role.padEnd(7)} ${person.email.padEnd(22)} ${PASSWORD}`);
    }
    console.warn('\nThe broker has two listings in the queue for the admin to approve.');
    console.warn('Change these passwords, or run --reset, before the site is public.\n');
  } finally {
    if (mongoose.connection.readyState === 1) await disconnectMongo();
  }
}

await main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
