import { Schema, model } from 'mongoose';
import { ulid } from 'ulid';
import { ENQUIRY_CHANNELS, ENQUIRY_STATUSES } from '@locatex/contracts';

/**
 * The three things a buyer leaves behind: what they saved, whose number they were given,
 * and what they asked.
 */

/**
 * A saved listing.
 *
 * v1 kept favourites in `localStorage`, so they vanished when someone cleared their browser
 * and never followed them to a phone. On the server they are the buyer's, not the device's.
 */
const favouriteSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },
    userId: { type: String, required: true, index: true },
    propertyId: { type: String, required: true },
  },
  { timestamps: true, strict: 'throw', versionKey: false, collection: 'favourites' },
);

// Saving twice is the same as saving once — enforced here rather than trusted to the UI,
// because a double-tap on a slow connection sends the request twice.
favouriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });
favouriteSchema.index({ userId: 1, _id: -1 });

/**
 * Who was shown which broker's contact details.
 *
 * Nothing is metered today — any signed-in buyer sees them. This is the record that makes
 * metering possible later without inventing history, and it is what lets a broker be told
 * "eleven buyers took your number this week", which is the number that tells them the
 * listing is working.
 */
const contactUnlockSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },
    userId: { type: String, required: true, index: true },
    propertyId: { type: String, required: true, index: true },
    brokerId: { type: String, required: true, index: true },
    ip: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: 'throw',
    versionKey: false,
    collection: 'contact_unlocks',
  },
);

// One row per buyer per listing per day. Without the date, a buyer refreshing a page ten
// times would look like ten interested people and make the broker's number meaningless.
contactUnlockSchema.index({ userId: 1, propertyId: 1, day: 1 }, { unique: true, sparse: true });
contactUnlockSchema.add({ day: { type: String, required: true } });

const enquirySchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },
    propertyId: { type: String, required: true, index: true },
    brokerId: { type: String, required: true, index: true },
    buyerId: { type: String, required: true, index: true },

    message: { type: String, trim: true, required: true, maxlength: 1500 },
    channel: { type: String, enum: ENQUIRY_CHANNELS, required: true, default: 'message' },
    callbackPhone: { type: String, trim: true, default: null },

    status: { type: String, enum: ENQUIRY_STATUSES, required: true, default: 'new', index: true },
    readAt: { type: Date, default: null },
    repliedAt: { type: Date, default: null },
  },
  { timestamps: true, strict: 'throw', versionKey: false, collection: 'enquiries' },
);

enquirySchema.index({ brokerId: 1, status: 1, _id: -1 });
enquirySchema.index({ buyerId: 1, _id: -1 });

export const FavouriteModel = model('Favourite', favouriteSchema);
export const ContactUnlockModel = model('ContactUnlock', contactUnlockSchema);
export const EnquiryModel = model('Enquiry', enquirySchema);
