/**
 * Loads the committed Gujarat reference data into MongoDB.
 *
 *   pnpm --filter @locatex/api seed:reference
 *
 * Idempotent: every write is an upsert keyed on a stable slug, so running it after a data
 * refresh updates names in place rather than duplicating them. Anything a geocoder has
 * already resolved is left alone — see the pincode branch.
 */
// Must come first: it populates the environment that later imports read.
import '../src/config/loadEnvFile.js';

import { readFileSync } from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../src/infrastructure/db/mongo.js';
import {
  DistrictModel,
  LandAttributeModel,
  PincodeModel,
  TalukaModel,
  VillageModel,
} from '../src/infrastructure/db/models/Reference.js';
import { LAND_ATTRIBUTES } from '../src/infrastructure/db/seed/landAttributes.js';
import { logger } from '../src/infrastructure/observability/logger.js';

interface SeedFile {
  source: string;
  generatedAt: string;
  districts: Array<{ name: string; slug: string }>;
  talukas: Array<{ name: string; slug: string; districtSlug: string }>;
  villages: Array<{
    name: string;
    slug: string;
    districtSlug: string;
    talukaSlug: string;
    pincode: string;
  }>;
  pincodes: Array<{
    pincode: string;
    districtSlug: string;
    talukaSlug: string;
    placeCount: number;
    hint: { lat: number; lng: number; agreement: number };
  }>;
}

export function loadSeed(): SeedFile {
  const file = path.resolve(import.meta.dirname, '../src/infrastructure/db/seed/gujarat.json');
  return JSON.parse(readFileSync(file, 'utf8')) as SeedFile;
}

export async function seedReferenceData(): Promise<{
  districts: number;
  talukas: number;
  villages: number;
  pincodes: number;
  attributes: number;
}> {
  const seed = loadSeed();

  await DistrictModel.bulkWrite(
    seed.districts.map((district) => ({
      updateOne: {
        filter: { _id: district.slug },
        update: {
          $set: {
            name: district.name,
            talukaCount: seed.talukas.filter((t) => t.districtSlug === district.slug).length,
          },
        },
        upsert: true,
      },
    })),
  );

  await TalukaModel.bulkWrite(
    seed.talukas.map((taluka) => ({
      updateOne: {
        filter: { _id: `${taluka.districtSlug}/${taluka.slug}` },
        update: {
          $set: { slug: taluka.slug, name: taluka.name, districtSlug: taluka.districtSlug },
        },
        upsert: true,
      },
    })),
  );

  // 8,900 villages: chunked so one oversized command does not hit the 16 MB BSON limit.
  for (let index = 0; index < seed.villages.length; index += 1000) {
    const chunk = seed.villages.slice(index, index + 1000);
    await VillageModel.bulkWrite(
      chunk.map((village) => ({
        updateOne: {
          filter: {
            _id: `${village.districtSlug}/${village.talukaSlug}/${village.slug}/${village.pincode}`,
          },
          update: {
            $set: {
              slug: village.slug,
              name: village.name,
              districtSlug: village.districtSlug,
              talukaSlug: village.talukaSlug,
              pincode: village.pincode,
            },
          },
          upsert: true,
        },
      })),
    );
  }

  await PincodeModel.bulkWrite(
    seed.pincodes.map((pincode) => ({
      updateOne: {
        filter: { _id: pincode.pincode },
        update: {
          // Only the seeded facts are set. A centroid resolved by a geocoder, and the radius
          // that came with it, are never overwritten by a reseed — that would throw away
          // better data in favour of the hint it replaced.
          $set: {
            districtSlug: pincode.districtSlug,
            talukaSlug: pincode.talukaSlug,
            placeCount: pincode.placeCount,
            hint: pincode.hint,
          },
        },
        upsert: true,
      },
    })),
  );

  await LandAttributeModel.bulkWrite(
    LAND_ATTRIBUTES.map((attribute) => ({
      updateOne: {
        filter: { _id: attribute.slug },
        update: {
          $set: {
            kind: attribute.kind,
            label: attribute.label,
            group: attribute.group,
            order: attribute.order,
            legacyValue: attribute.legacyValue ?? null,
          },
          $setOnInsert: { isActive: true },
        },
        upsert: true,
      },
    })),
  );

  return {
    districts: seed.districts.length,
    talukas: seed.talukas.length,
    villages: seed.villages.length,
    pincodes: seed.pincodes.length,
    attributes: LAND_ATTRIBUTES.length,
  };
}

// Only run when invoked directly, so tests can import the seeder.
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  await connectMongo();
  const counts = await seedReferenceData();
  logger.info(counts, 'reference data seeded');
  await disconnectMongo();
  await mongoose.disconnect();
}
