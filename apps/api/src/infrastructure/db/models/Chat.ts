import { Schema, model } from 'mongoose';
import { ulid } from 'ulid';
import { MESSAGE_MAX_LENGTH, REPORT_REASONS } from '@locatex/contracts';

/**
 * One conversation per (listing, buyer), and the messages in it.
 *
 * The thread carries a denormalised preview and a per-person unread count. That is a
 * deliberate duplication: the inbox is the most-opened page in the product, and rendering
 * it from the messages themselves would mean an aggregation over every message a person
 * has ever received, every time they look.
 */
const chatThreadSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },

    propertyId: { type: String, required: true, index: true },
    brokerId: { type: String, required: true, index: true },
    buyerId: { type: String, required: true, index: true },

    lastMessageAt: { type: Date, default: null },
    lastMessagePreview: { type: String, default: null },
    lastSenderId: { type: String, default: null },

    /** Unread counts, keyed by user id. Kept in step with the messages on every send. */
    unread: { type: Map, of: Number, default: () => new Map() },

    /**
     * Blocking is one-sided and reversible: the person who blocked stops receiving, the
     * other side is not told. Telling them turns a quiet exit into an argument.
     */
    blockedBy: { type: [String], default: [] },

    reportedBy: { type: [String], default: [] },
    reportReason: { type: String, enum: [...REPORT_REASONS, null], default: null },
    reportDetail: { type: String, trim: true, maxlength: 1000, default: null },
    reportedAt: { type: Date, default: null },

    /** Set when a digest has gone out, so the same silence is not emailed about twice. */
    digestSentAt: { type: Date, default: null },
  },
  { timestamps: true, strict: 'throw', versionKey: false, collection: 'chat_threads' },
);

// One conversation per buyer per listing — starting a second one from a different page
// would split the history in half.
chatThreadSchema.index({ propertyId: 1, buyerId: 1 }, { unique: true });
chatThreadSchema.index({ brokerId: 1, lastMessageAt: -1 });
chatThreadSchema.index({ buyerId: 1, lastMessageAt: -1 });
// The digest job's query: threads with something unread and nothing sent about it yet.
chatThreadSchema.index({ lastMessageAt: 1, digestSentAt: 1 });

const chatMessageSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },
    threadId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },

    /**
     * Stored exactly as typed. Contact details are deliberately not masked — the client
     * decided people may swap numbers, and a regular expression that hides phone numbers
     * also hides survey numbers, khaata numbers and prices.
     */
    body: { type: String, required: true, maxlength: MESSAGE_MAX_LENGTH },

    /** Echoed back so a sender can match its optimistic line to the saved one. */
    clientId: { type: String, default: null },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: 'throw',
    versionKey: false,
    collection: 'chat_messages',
  },
);

// The only query that matters: a page of one thread, newest last, paged backwards.
chatMessageSchema.index({ threadId: 1, _id: -1 });

export const ChatThreadModel = model('ChatThread', chatThreadSchema);
export const ChatMessageModel = model('ChatMessage', chatMessageSchema);
export type ChatThreadDoc = InstanceType<typeof ChatThreadModel>;
