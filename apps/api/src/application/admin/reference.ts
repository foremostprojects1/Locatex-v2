import mongoose from 'mongoose';
import { z } from 'zod';
import {
  DistrictModel,
  PincodeModel,
  TalukaModel,
  VillageModel,
} from '../../infrastructure/db/models/Reference.js';
import { PropertyModel } from '../../infrastructure/db/models/Property.js';
import { AppError } from '../../shared/AppError.js';

/**
 * Editing Gujarat's own administrative data.
 *
 * There are 8,917 villages. That number is the whole design constraint here: every list is
 * paged and every search is served by an index, because a screen that fetches all of them
 * to filter in the browser works on a developer's laptop with the seed data and stops
 * working the first time somebody adds a district's worth of villages.
 *
 * Deletion is guarded rather than offered freely. A village is referenced by every listing
 * that sits in it, and MongoDB will not stop you removing one — so this does, by counting
 * first and refusing when the answer is not zero.
 */

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{2,60}$/, 'Use lower-case letters, numbers and hyphens');

const nameSchema = z.string().trim().min(2).max(80);

export const referenceQuerySchema = z
  .object({
    q: z.string().trim().max(60).optional(),
    district: slugSchema.optional(),
    taluka: slugSchema.optional(),
    /** Keyset, not a page number — see the note on `listVillages`. */
    cursor: z.string().max(120).optional(),
    limit: z.coerce.number().int().positive().max(100).default(50),
  })
  .strict();

export type ReferenceQuery = z.infer<typeof referenceQuerySchema>;

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A prefix match, not a contains match.
 *
 * `^ba` uses the index on `name`; `.*ba.*` cannot, and turns every keystroke into a
 * collection scan across nine thousand rows. Prefix is also what people expect when they
 * start typing a village name.
 */
const prefixOf = (q: string): RegExp => new RegExp(`^${escapeRegex(q)}`, 'i');

export async function listDistricts(query: unknown) {
  const { q } = referenceQuerySchema.parse(query);
  const filter: Record<string, unknown> = {};
  if (q) filter.name = prefixOf(q);

  const rows = await DistrictModel.find(filter).sort({ name: 1 }).lean();

  return {
    data: rows.map((row) => ({
      slug: String(row._id),
      name: row.name,
      talukaCount: row.talukaCount ?? 0,
    })),
    // Thirty-four of them. Paging this would be ceremony.
    nextCursor: null,
    total: rows.length,
  };
}

export async function listTalukas(query: unknown) {
  const { q, district } = referenceQuerySchema.parse(query);
  const filter: Record<string, unknown> = {};
  if (district) filter.districtSlug = district;
  if (q) filter.name = prefixOf(q);

  const rows = await TalukaModel.find(filter).sort({ name: 1 }).limit(500).lean();

  return {
    data: rows.map((row) => ({
      id: String(row._id),
      slug: row.slug,
      name: row.name,
      districtSlug: row.districtSlug,
    })),
    nextCursor: null,
    total: await TalukaModel.countDocuments(filter),
  };
}

/**
 * The one that actually needs paging.
 *
 * Keyset rather than skip/limit: `skip` re-reads and discards every row before the offset,
 * so page 150 of the villages costs a hundred and fifty times page one. A cursor of the
 * last `_id` costs the same on every page, and does not repeat or drop a row when a village
 * is added while somebody is paging.
 */
export async function listVillages(query: unknown) {
  const { q, district, taluka, cursor, limit } = referenceQuerySchema.parse(query);

  const filter: Record<string, unknown> = {};
  if (district) filter.districtSlug = district;
  if (taluka) filter.talukaSlug = taluka;
  if (q) filter.name = prefixOf(q);
  if (cursor) filter._id = mongoose.trusted({ $gt: cursor });

  const rows = await VillageModel.find(filter)
    .sort({ _id: 1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  // Counted separately and only for the filtered set — an unfiltered count of nine
  // thousand is a number nobody reads, but "142 in Morbi" is worth having.
  const total = await VillageModel.countDocuments(filter);

  return {
    data: page.map((row) => ({
      id: String(row._id),
      slug: row.slug,
      name: row.name,
      districtSlug: row.districtSlug,
      talukaSlug: row.talukaSlug,
      pincode: row.pincode,
    })),
    nextCursor: hasMore && last ? String(last._id) : null,
    total,
  };
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

export const districtInputSchema = z
  .object({ slug: slugSchema, name: nameSchema })
  .strict();

export const talukaInputSchema = z
  .object({ slug: slugSchema, name: nameSchema, districtSlug: slugSchema })
  .strict();

export const villageInputSchema = z
  .object({
    slug: slugSchema,
    name: nameSchema,
    districtSlug: slugSchema,
    talukaSlug: slugSchema,
    pincode: z.string().regex(/^[1-9]\d{5}$/, 'A pincode is six digits'),
  })
  .strict();

export async function upsertDistrict(input: unknown) {
  const data = districtInputSchema.parse(input);
  await DistrictModel.updateOne(
    { _id: data.slug },
    { $set: { name: data.name } },
    { upsert: true },
  );
  return { slug: data.slug };
}

export async function upsertTaluka(input: unknown) {
  const data = talukaInputSchema.parse(input);
  await assertDistrictExists(data.districtSlug);

  // The id encodes the hierarchy, so a taluka cannot exist in two districts at once and a
  // rename does not create a duplicate.
  const id = `${data.districtSlug}/${data.slug}`;
  await TalukaModel.updateOne(
    { _id: id },
    { $set: { slug: data.slug, name: data.name, districtSlug: data.districtSlug } },
    { upsert: true },
  );

  await refreshTalukaCount(data.districtSlug);
  return { id };
}

export async function upsertVillage(input: unknown) {
  const data = villageInputSchema.parse(input);
  await assertDistrictExists(data.districtSlug);

  const taluka = await TalukaModel.exists({
    districtSlug: data.districtSlug,
    slug: data.talukaSlug,
  });
  if (!taluka) {
    throw AppError.validation([
      { field: 'talukaSlug', code: 'unknown', message: 'That taluka is not in this district.' },
    ]);
  }

  const id = `${data.districtSlug}/${data.talukaSlug}/${data.slug}/${data.pincode}`;
  await VillageModel.updateOne(
    {  _id: id },
    {
      $set: {
        slug: data.slug,
        name: data.name,
        districtSlug: data.districtSlug,
        talukaSlug: data.talukaSlug,
        pincode: data.pincode,
      },
    },
    { upsert: true },
  );

  // A village implies its pincode; without this the address cascade rejects a listing in a
  // village that was just added.
  await PincodeModel.updateOne(
    { _id: data.pincode },
    {
      $setOnInsert: { districtSlug: data.districtSlug, talukaSlug: data.talukaSlug },
      $inc: { placeCount: 0 },
    },
    { upsert: true },
  );

  return { id };
}

/**
 * Removing a place, but only when nothing stands on it.
 *
 * MongoDB enforces no relationships, so deleting a village that listings refer to would
 * leave those listings pointing at an address the cascade cannot resolve — the broker's
 * form would then reject their own listing on the next edit, for a reason nobody could
 * see. Counting first turns that into a refusal with a number in it.
 */
export async function removeReference(
  kind: 'district' | 'taluka' | 'village',
  id: string,
): Promise<void> {
  if (kind === 'district') {
    const used = await PropertyModel.countDocuments({ 'location.district': id, deletedAt: null });
    if (used > 0) {
      throw new AppError('CONFLICT', `${used} listing${used === 1 ? '' : 's'} sit in this district.`);
    }
    const talukas = await TalukaModel.countDocuments({ districtSlug: id });
    if (talukas > 0) {
      throw new AppError('CONFLICT', `Remove its ${talukas} talukas first.`);
    }
    await DistrictModel.deleteOne({ _id: id });
    return;
  }

  if (kind === 'taluka') {
    const taluka = await TalukaModel.findById(id).lean();
    if (!taluka) throw AppError.notFound('Taluka');

    const used = await PropertyModel.countDocuments({
      'location.district': taluka.districtSlug,
      'location.taluka': taluka.slug,
      deletedAt: null,
    });
    if (used > 0) {
      throw new AppError('CONFLICT', `${used} listing${used === 1 ? '' : 's'} sit in this taluka.`);
    }

    const villages = await VillageModel.countDocuments({
      districtSlug: taluka.districtSlug,
      talukaSlug: taluka.slug,
    });
    if (villages > 0) throw new AppError('CONFLICT', `Remove its ${villages} villages first.`);

    await TalukaModel.deleteOne({ _id: id });
    await refreshTalukaCount(taluka.districtSlug);
    return;
  }

  const village = await VillageModel.findById(id).lean();
  if (!village) throw AppError.notFound('Village');

  const used = await PropertyModel.countDocuments({
    'location.district': village.districtSlug,
    'location.village': village.slug,
    deletedAt: null,
  });
  if (used > 0) {
    throw new AppError('CONFLICT', `${used} listing${used === 1 ? '' : 's'} sit in this village.`);
  }

  await VillageModel.deleteOne({ _id: id });
}

async function assertDistrictExists(slug: string): Promise<void> {
  if (!(await DistrictModel.exists({ _id: slug }))) {
    throw AppError.validation([
      { field: 'districtSlug', code: 'unknown', message: 'No such district.' },
    ]);
  }
}

/** Kept accurate because the public district list prints it. */
async function refreshTalukaCount(districtSlug: string): Promise<void> {
  const talukaCount = await TalukaModel.countDocuments({ districtSlug });
  await DistrictModel.updateOne({ _id: districtSlug }, { $set: { talukaCount } });
}
