import { Schema, model } from 'mongoose';
import { ulid } from 'ulid';

/**
 * A news item or advertisement with a start and an end.
 *
 * The window is stored rather than a computed "live" flag. A flag has to be flipped by
 * something, and the job meant to flip it will one day not run — leaving last month's offer
 * on the homepage. Two dates are true whether or not anything is running.
 */
const newsItemSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },

    title: { type: String, trim: true, required: true, maxlength: 120 },
    body: { type: String, trim: true, required: true, maxlength: 4000 },
    imageUrl: { type: String, default: null },
    linkUrl: { type: String, default: null },

    startsAt: { type: Date, required: true },
    endsAt: { type: Date, default: null },
    isActive: { type: Boolean, required: true, default: true },
    isPinned: { type: Boolean, required: true, default: false },

    createdBy: { type: String, required: true },
    updatedBy: { type: String, default: null },
  },
  {
    timestamps: true,
    strict: 'throw',
    versionKey: false,
    collection: 'news_items',
  },
);

// The public query: active, already started, not yet finished, pinned first.
newsItemSchema.index({ isActive: 1, startsAt: -1, endsAt: 1 });
newsItemSchema.index({ isPinned: -1, startsAt: -1 });

export const NewsItemModel = model('NewsItem', newsItemSchema);
