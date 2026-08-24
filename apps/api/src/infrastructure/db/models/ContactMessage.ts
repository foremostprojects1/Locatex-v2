import { Schema, model } from 'mongoose';
import { ulid } from 'ulid';
import { CONTACT_STATUSES, CONTACT_SUBJECTS } from '@locatex/contracts';

/**
 * A message from the contact form.
 *
 * v1 emailed these and kept nothing, so a message lost to a spam folder was lost for good.
 * Here the record is written first and the email is a notification about it — if the mail
 * fails, the message is still in the admin's inbox on the dashboard.
 */
const contactMessageSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },

    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true },
    phone: { type: String, trim: true, default: null },
    subject: { type: String, enum: CONTACT_SUBJECTS, required: true, default: 'general' },
    message: { type: String, trim: true, required: true },

    /** Set when the form was opened from a listing page. */
    propertyId: { type: String, default: null },
    /** Set when the sender happened to be signed in. */
    userId: { type: String, default: null },

    status: { type: String, enum: CONTACT_STATUSES, required: true, default: 'new', index: true },
    handledBy: { type: String, default: null },
    handledAt: { type: Date, default: null },
    adminNote: { type: String, trim: true, maxlength: 2000, default: null },

    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: true,
    strict: 'throw',
    versionKey: false,
    collection: 'contact_messages',
  },
);

contactMessageSchema.index({ status: 1, _id: -1 });
contactMessageSchema.index({ email: 1, createdAt: -1 });

export const ContactMessageModel = model('ContactMessage', contactMessageSchema);
