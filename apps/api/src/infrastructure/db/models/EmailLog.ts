import { Schema, model } from 'mongoose';
import { ulid } from 'ulid';

/**
 * Every message the system tried to send.
 *
 * This exists so "did the broker get the rejection?" has an answer. It is also the daily
 * volume counter: Gmail allows roughly 500 messages a day from a free account and enforces
 * that by locking the account rather than by refusing one message, so we have to know our
 * own rate before Google tells us.
 *
 * The collection and its unique dedupe index are created by the `20260816-0001` migration.
 */
const emailLogSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },

    to: { type: String, required: true, lowercase: true, trim: true },
    template: { type: String, required: true, index: true },
    subject: { type: String, required: true },

    status: {
      type: String,
      enum: ['queued', 'sent', 'failed', 'suppressed'],
      required: true,
      default: 'queued',
      index: true,
    },

    /** Present only when the caller asked for idempotence; the unique index is partial. */
    dedupeKey: { type: String, default: undefined },

    attempts: { type: Number, default: 0 },
    sentAt: { type: Date, default: null },
    /** The provider's own id, so a message can be traced in Gmail's sent folder. */
    providerMessageId: { type: String, default: null },
    error: { type: String, default: null },
    /** Set when the send was refused by our own daily cap rather than by the provider. */
    suppressedReason: { type: String, default: null },
  },
  {
    timestamps: true,
    strict: 'throw',
    versionKey: false,
    collection: 'email_log',
  },
);

emailLogSchema.index({ createdAt: -1 });

/**
 * The redelivery guard, declared here as well as in the migration.
 *
 * The migration is what builds it in production, so a deploy never builds an index in the
 * foreground. Declaring it on the schema too means it also exists on a developer's machine
 * and in the test suite — without it, `QueuedMailer` would be catching a duplicate-key
 * error that never arrives, and the same digest could go out twice with nothing to notice.
 */
emailLogSchema.index(
  { template: 1, to: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } },
);

export const EmailLogModel = model('EmailLog', emailLogSchema);
