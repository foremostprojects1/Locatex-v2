import mongoose from 'mongoose';
import { isNewsLive, newsItemSchema, newsItemUpdateSchema } from '@locatex/contracts';
import { NewsItemModel } from '../../infrastructure/db/models/NewsItem.js';
import { AppError } from '../../shared/AppError.js';

/**
 * Timed news and advertisements.
 *
 * "Live" is derived from the dates on every read rather than stored, so an item ends when
 * its end date passes even if nothing is scheduled to notice.
 */
export async function createNewsItem(adminId: string, input: unknown) {
  const data = newsItemSchema.parse(input);
  return NewsItemModel.create({
    ...data,
    imageUrl: data.imageUrl ?? null,
    linkUrl: data.linkUrl ?? null,
    endsAt: data.endsAt ?? null,
    createdBy: adminId,
  });
}

export async function updateNewsItem(adminId: string, id: string, input: unknown) {
  const data = newsItemUpdateSchema.parse(input);
  const item = await NewsItemModel.findById(id);
  if (!item) throw AppError.notFound('News item');

  // The window rule cannot live in the field schema, because an edit may supply only one
  // of the two dates and has to be checked against the one already stored.
  const startsAt = data.startsAt ?? item.startsAt;
  const endsAt = data.endsAt === undefined ? item.endsAt : data.endsAt;
  if (endsAt && endsAt <= startsAt) {
    throw AppError.validation([
      { field: 'endsAt', code: 'invalid', message: 'The end has to come after the start' },
    ]);
  }

  for (const [key, value] of Object.entries(data)) {
    item.set(key, value ?? null);
  }
  item.updatedBy = adminId;
  await item.save();
  return item;
}

export async function deleteNewsItem(id: string): Promise<void> {
  const result = await NewsItemModel.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw AppError.notFound('News item');
}

/** What the public site shows right now: started, not finished, pinned first. */
export async function liveNews(now: Date = new Date(), limit = 20) {
  const items = await NewsItemModel.find({
    isActive: true,
    startsAt: mongoose.trusted({ $lte: now }),
    $or: [{ endsAt: null }, { endsAt: mongoose.trusted({ $gt: now }) }],
  })
    .sort({ isPinned: -1, startsAt: -1 })
    .limit(limit)
    .lean();

  return items.map(publicView);
}

/** Everything, live or not, with the verdict attached so the admin list can say which. */
export async function allNews(now: Date = new Date()) {
  const items = await NewsItemModel.find({}).sort({ startsAt: -1 }).limit(200).lean();
  return items.map((item) => ({
    ...publicView(item),
    isActive: item.isActive,
    endsAt: item.endsAt ?? null,
    isLive: isNewsLive(
      { isActive: item.isActive, startsAt: item.startsAt, endsAt: item.endsAt },
      now,
    ),
    createdBy: item.createdBy,
    updatedAt: item.updatedAt,
  }));
}

const publicView = (item: {
  _id?: unknown;
  title: string;
  body: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  startsAt: Date;
  isPinned: boolean;
}) => ({
  id: String(item._id),
  title: item.title,
  body: item.body,
  imageUrl: item.imageUrl ?? null,
  linkUrl: item.linkUrl ?? null,
  startsAt: item.startsAt,
  isPinned: item.isPinned,
});
