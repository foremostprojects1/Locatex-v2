import { Schema, model } from 'mongoose';
import { ulid } from 'ulid';

/**
 * The wizard's server-side memory.
 *
 * A broker fills in five steps on a phone, over a patchy connection, sometimes across two
 * sittings. Keeping that state in the browser would lose it to a closed tab, a flat battery
 * or a different device — so every step is saved here as it is typed, and a draft is picked
 * up wherever it was left.
 *
 * It is deliberately a separate collection from `properties`. A listing's schema requires a
 * title, a price, an area and a location; a draft is by definition missing most of them,
 * and relaxing the listing schema to accommodate half-filled forms would remove the
 * guarantee that anything in `properties` is complete.
 */
const propertyDraftSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },
    brokerId: { type: String, required: true, index: true },

    /** Set when the wizard is editing a listing that already exists rather than a new one. */
    propertyId: { type: String, default: null },

    /** Where the broker was, so "continue" reopens the right step. */
    step: { type: String, default: 'basics' },

    /**
     * The partially filled form, in exactly the shape `createPropertySchema` expects, so
     * finishing is a parse rather than a translation. Validated against
     * `propertyDraftDataSchema` before it is written — `Mixed` means Mongoose will not
     * check it, not that anything may go in.
     */
    data: { type: Schema.Types.Mixed, default: () => ({}) },

    lastSavedAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    strict: 'throw',
    versionKey: false,
    collection: 'property_drafts',
  },
);

propertyDraftSchema.index({ brokerId: 1, updatedAt: -1 });

export const PropertyDraftModel = model('PropertyDraft', propertyDraftSchema);
export type PropertyDraftDoc = InstanceType<typeof PropertyDraftModel>;
