import { Schema, model } from 'mongoose';
import { logger } from '../observability/logger.js';

/**
 * India Post's free pincode API, used as a cross-check when a broker types a pincode.
 *
 * It is authoritative about post offices and useless about districts: pincode 363641 still
 * reports "Rajkot" although Morbi has been a district since 2013. So its answer is shown
 * beside ours as a hint, never used to overwrite the address a broker selected.
 *
 * Cached for 30 days in Mongo. The endpoint is free and unmetered, which is exactly why it
 * deserves to be treated politely.
 */

const CACHE_DAYS = 30;
const ENDPOINT = 'https://api.postalpincode.in/pincode';

const cacheSchema = new Schema(
  {
    _id: { type: String }, // pincode
    district: { type: String, default: null },
    block: { type: String, default: null },
    offices: { type: [String], default: [] },
    found: { type: Boolean, default: false },
    fetchedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { strict: 'throw', versionKey: false, collection: 'cache_india_post' },
);
cacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IndiaPostCacheModel = model('IndiaPostCache', cacheSchema);

export interface PostalLookup {
  district: string;
  block: string;
  offices: string[];
}

interface PostOffice {
  Name?: string;
  District?: string;
  Block?: string;
  State?: string;
}

export async function lookupPostalPincode(
  pincode: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PostalLookup | null> {
  const cached = await IndiaPostCacheModel.findById(pincode).lean();
  if (cached && cached.expiresAt > new Date()) {
    return cached.found
      ? {
          district: cached.district ?? '',
          block: cached.block ?? '',
          offices: cached.offices ?? [],
        }
      : null;
  }

  let result: PostalLookup | null = null;
  try {
    const response = await fetchImpl(`${ENDPOINT}/${pincode}`, {
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      const body = (await response.json()) as Array<{
        Status?: string;
        PostOffice?: PostOffice[] | null;
      }>;
      const offices = body[0]?.PostOffice ?? [];
      if (body[0]?.Status === 'Success' && offices.length > 0) {
        result = {
          district: offices[0]?.District ?? '',
          block: offices[0]?.Block ?? '',
          offices: offices.map((office) => office.Name ?? '').filter(Boolean),
        };
      }
    }
  } catch (error) {
    // A lookup that fails is a missing hint, not a failed request: the caller still has our
    // own district and taluka, which are the data the form actually depends on.
    logger.warn({ pincode, err: error }, 'india post lookup failed');
    return cached?.found
      ? { district: cached.district ?? '', block: cached.block ?? '', offices: cached.offices ?? [] }
      : null;
  }

  const now = new Date();
  await IndiaPostCacheModel.updateOne(
    { _id: pincode },
    {
      $set: {
        district: result?.district ?? null,
        block: result?.block ?? null,
        offices: result?.offices ?? [],
        found: Boolean(result),
        fetchedAt: now,
        expiresAt: new Date(now.getTime() + CACHE_DAYS * 86_400_000),
      },
    },
    { upsert: true },
  );

  return result;
}
