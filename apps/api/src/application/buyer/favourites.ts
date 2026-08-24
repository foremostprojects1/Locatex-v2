import mongoose from 'mongoose';
import { PUBLIC_STATUSES } from '@locatex/contracts';
import { FavouriteModel } from '../../infrastructure/db/models/Buyer.js';
import { PropertyModel } from '../../infrastructure/db/models/Property.js';
import type { SerializableProperty } from '../../domain/property/serialize.js';
import { AppError } from '../../shared/AppError.js';

/**
 * Saved listings.
 *
 * v1 kept these in `localStorage`, so they were lost with a cleared browser and never
 * followed anyone to a phone. Here they belong to the account.
 */

export async function addFavourite(userId: string, propertyId: string): Promise<void> {
  const property = await PropertyModel.findOne({
    _id: propertyId,
    deletedAt: null,
    status: mongoose.trusted({ $in: [...PUBLIC_STATUSES] }),
  })
    .select('_id')
    .lean();

  // Only a listing somebody can actually see. Otherwise a draft's id could be probed for
  // existence by watching which saves succeed.
  if (!property) throw AppError.notFound('Listing');

  try {
    await FavouriteModel.create({ userId, propertyId });
  } catch (error) {
    // Saving twice is the same as saving once; the unique index is what makes it so.
    if (!isDuplicate(error)) throw error;
  }
}

export async function removeFavourite(userId: string, propertyId: string): Promise<void> {
  await FavouriteModel.deleteOne({ userId, propertyId });
}

/** The ids only — enough for the heart on a card to be filled in, and nothing more. */
export async function favouriteIds(userId: string): Promise<string[]> {
  const rows = await FavouriteModel.find({ userId }).select('propertyId').lean();
  return rows.map((row) => row.propertyId);
}

export interface FavouritePage {
  items: SerializableProperty[];
  nextCursor: string | null;
  total: number;
  /** Listings that were saved and have since been withdrawn or deleted. */
  unavailable: number;
}

/**
 * The saved list itself.
 *
 * A listing saved months ago may have been sold or withdrawn since. Those are counted and
 * reported rather than silently dropped: "three of your saved listings are no longer
 * available" is useful, and a list that quietly shrinks is unsettling.
 */
export async function listFavourites(
  userId: string,
  options: { limit?: number; cursor?: string } = {},
): Promise<FavouritePage> {
  const limit = options.limit ?? 24;

  const filter: Record<string, unknown> = { userId };
  if (options.cursor) filter._id = mongoose.trusted({ $lt: options.cursor });

  const saved = await FavouriteModel.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = saved.length > limit;
  const page = hasMore ? saved.slice(0, limit) : saved;
  const ids = page.map((row) => row.propertyId);

  const properties = await PropertyModel.find({
    _id: mongoose.trusted({ $in: ids }),
    deletedAt: null,
    status: mongoose.trusted({ $in: [...PUBLIC_STATUSES] }),
  }).lean();

  const byId = new Map(properties.map((property) => [String(property._id), property]));
  // Ordered by when they were saved, newest first — not by the order Mongo returned them.
  const items = ids.map((id) => byId.get(id)).filter(Boolean);

  const last = page[page.length - 1];
  return {
    items: items as unknown as SerializableProperty[],
    nextCursor: hasMore && last ? String(last._id) : null,
    total: await FavouriteModel.countDocuments({ userId }),
    unavailable: ids.length - items.length,
  };
}

const isDuplicate = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
