import mongoose from 'mongoose';
import type { z } from 'zod';
import {
  MESSAGES_PER_MINUTE,
  PUBLIC_STATUSES,
  sendMessageSchema,
  type SendMessageInput,
  type reportReasonSchema,
} from '@locatex/contracts';
import {
  ChatMessageModel,
  ChatThreadModel,
  type ChatThreadDoc,
} from '../../infrastructure/db/models/Chat.js';
import { PropertyModel } from '../../infrastructure/db/models/Property.js';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { AppError } from '../../shared/AppError.js';

type ReportReason = z.infer<typeof reportReasonSchema>;

/**
 * Conversations between a buyer and a broker about one listing.
 *
 * The rule that shapes everything here: a thread belongs to exactly two people, and every
 * read and every write checks that the caller is one of them. There is no "thread id is
 * hard to guess" reasoning anywhere — ULIDs are sortable and therefore partly predictable,
 * and a private conversation is not something to protect with obscurity.
 */

export interface Participant {
  id: string;
  role: 'buyer' | 'broker' | 'admin';
}

/** Both sides of a thread, or a refusal. Every operation starts here. */
export async function threadFor(threadId: string, user: Participant): Promise<ChatThreadDoc> {
  const thread = await ChatThreadModel.findById(threadId);
  if (!thread) throw AppError.notFound('Conversation');

  if (thread.brokerId !== user.id && thread.buyerId !== user.id) {
    // Not 403: whether a conversation exists is itself private.
    throw AppError.notFound('Conversation');
  }
  return thread;
}

const otherPersonIn = (thread: ChatThreadDoc, userId: string): string =>
  thread.brokerId === userId ? thread.buyerId : thread.brokerId;

/**
 * Opens the conversation about a listing, or returns the one that already exists.
 *
 * A buyer starts these; a broker replies. A broker cannot open a conversation with a buyer
 * out of nowhere, which is what keeps the inbox from becoming a place brokers advertise.
 */
export async function openThread(
  buyerId: string,
  propertyId: string,
): Promise<ChatThreadDoc> {
  const property = await PropertyModel.findOne({
    _id: propertyId,
    deletedAt: null,
    status: mongoose.trusted({ $in: [...PUBLIC_STATUSES] }),
  })
    .select('_id brokerId')
    .lean();

  if (!property) throw AppError.notFound('Listing');
  if (property.brokerId === buyerId) {
    throw new AppError('CONFLICT', 'This is your own listing.');
  }

  const existing = await ChatThreadModel.findOne({ propertyId, buyerId });
  if (existing) return existing;

  try {
    return await ChatThreadModel.create({
      propertyId,
      buyerId,
      brokerId: property.brokerId,
    });
  } catch (error) {
    // Two taps on "message the broker" race here; the unique index settles it.
    if (isDuplicate(error)) {
      const thread = await ChatThreadModel.findOne({ propertyId, buyerId });
      if (thread) return thread;
    }
    throw error;
  }
}

export interface SentMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  clientId: string | null;
  createdAt: Date;
  /** Who should be told about it in real time. */
  recipientId: string;
}

export async function sendMessage(
  threadId: string,
  user: Participant,
  input: SendMessageInput,
): Promise<SentMessage> {
  const data = sendMessageSchema.parse(input);
  const thread = await threadFor(threadId, user);

  // A block is one-sided: the person who blocked stops receiving. The other side is not
  // told, because telling them turns a quiet exit into an argument.
  if (thread.blockedBy.includes(user.id)) {
    throw new AppError('FORBIDDEN', 'You have blocked this conversation.');
  }

  await assertNotFlooding(user.id);

  const recipientId = otherPersonIn(thread, user.id);
  const blockedByRecipient = thread.blockedBy.includes(recipientId);

  const message = await ChatMessageModel.create({
    threadId,
    senderId: user.id,
    body: data.body,
    clientId: data.clientId ?? null,
  });

  thread.lastMessageAt = message.createdAt;
  thread.lastSenderId = user.id;
  thread.lastMessagePreview = data.body.slice(0, 140);

  // A blocked recipient's unread count does not move, so their inbox stays quiet and the
  // digest job never emails them about it. The message is still stored: if they unblock,
  // the history is whole.
  if (!blockedByRecipient) {
    thread.unread.set(recipientId, (thread.unread.get(recipientId) ?? 0) + 1);
    // New activity deserves a fresh digest window.
    thread.digestSentAt = null;
  }
  await thread.save();

  return {
    id: message.id,
    threadId,
    senderId: user.id,
    body: message.body,
    clientId: message.clientId ?? null,
    createdAt: message.createdAt,
    recipientId: blockedByRecipient ? '' : recipientId,
  };
}

/**
 * A page of one conversation, newest first.
 *
 * Reading is what marks messages read — there is no separate "mark as read" call to forget
 * to make, and a read receipt that depends on the client remembering to send one is a read
 * receipt that lies.
 */
export async function readThread(
  threadId: string,
  user: Participant,
  options: { limit?: number; before?: string } = {},
) {
  const thread = await threadFor(threadId, user);
  const limit = Math.min(options.limit ?? 50, 100);

  const filter: Record<string, unknown> = { threadId };
  if (options.before) filter._id = mongoose.trusted({ $lt: options.before });

  const rows = await ChatMessageModel.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  const now = new Date();
  const unreadFromOther = thread.unread.get(user.id) ?? 0;
  if (unreadFromOther > 0) {
    thread.unread.set(user.id, 0);
    await thread.save();
    await ChatMessageModel.updateMany(
      { threadId, senderId: mongoose.trusted({ $ne: user.id }), readAt: null },
      { $set: { readAt: now } },
    );
  }

  return {
    thread,
    // Oldest first, which is the order a conversation is read in.
    messages: page.reverse(),
    nextBefore: hasMore ? String(page[0]?._id) : null,
    markedRead: unreadFromOther,
  };
}

/** Every conversation this person is in, most recent first, with the other side named. */
export async function listThreads(user: Participant) {
  const threads = await ChatThreadModel.find({
    $or: [{ brokerId: user.id }, { buyerId: user.id }],
  })
    .sort({ lastMessageAt: -1, _id: -1 })
    .limit(100)
    .lean();

  const otherIds = [...new Set(threads.map((thread) =>
    thread.brokerId === user.id ? thread.buyerId : thread.brokerId,
  ))];
  const propertyIds = [...new Set(threads.map((thread) => thread.propertyId))];

  const [people, properties] = await Promise.all([
    UserModel.find({ _id: mongoose.trusted({ $in: otherIds }) })
      .select('fullName avatarUrl role')
      .lean(),
    PropertyModel.find({ _id: mongoose.trusted({ $in: propertyIds }) })
      .select('title images status')
      .lean(),
  ]);

  const peopleById = new Map(people.map((person) => [String(person._id), person]));
  const propertiesById = new Map(properties.map((property) => [String(property._id), property]));

  return threads.map((thread) => {
    const otherId = thread.brokerId === user.id ? thread.buyerId : thread.brokerId;
    const other = peopleById.get(otherId);
    const property = propertiesById.get(thread.propertyId);
    const unread = readUnread(thread.unread, user.id);

    return {
      id: String(thread._id),
      propertyId: thread.propertyId,
      propertyTitle: property?.title ?? 'A listing that is no longer available',
      propertyImage: property?.images?.[0]?.url ?? null,
      other: {
        id: otherId,
        name: other?.fullName ?? 'Someone',
        avatarUrl: other?.avatarUrl ?? null,
        role: other?.role ?? 'buyer',
      },
      lastMessageAt: thread.lastMessageAt,
      lastMessagePreview: thread.lastMessagePreview,
      lastFromMe: thread.lastSenderId === user.id,
      unread,
      blocked: thread.blockedBy.includes(user.id),
    };
  });
}

export async function unreadTotal(userId: string): Promise<number> {
  const threads = await ChatThreadModel.find({
    $or: [{ brokerId: userId }, { buyerId: userId }],
  })
    .select('unread')
    .lean();

  return threads.reduce((total, thread) => total + readUnread(thread.unread, userId), 0);
}

export async function setBlocked(
  threadId: string,
  user: Participant,
  blocked: boolean,
): Promise<void> {
  const thread = await threadFor(threadId, user);
  const already = thread.blockedBy.includes(user.id);

  if (blocked && !already) {
    thread.blockedBy.push(user.id);

    // Blocking has to silence what has already arrived, not only what comes next.
    // Otherwise the message that made someone block sits unread in their inbox, and the
    // digest job emails them about it a day later — which is precisely the thing they
    // just asked to stop.
    thread.unread.set(user.id, 0);
    thread.digestSentAt = new Date();
  }

  if (!blocked && already) {
    thread.blockedBy = thread.blockedBy.filter((id) => id !== user.id);
    // The count is not restored: the messages are all still there to read, and a badge
    // reappearing for something already seen would be noise.
  }
  await thread.save();
}

export async function reportThread(
  threadId: string,
  user: Participant,
  reason: ReportReason,
  detail?: string,
): Promise<void> {
  const thread = await threadFor(threadId, user);

  if (!thread.reportedBy.includes(user.id)) thread.reportedBy.push(user.id);
  thread.reportReason = reason;
  thread.reportDetail = detail ?? null;
  thread.reportedAt = new Date();

  // Reporting blocks as well. Someone reporting abuse should not have to take a second
  // action to stop receiving it.
  if (!thread.blockedBy.includes(user.id)) thread.blockedBy.push(user.id);
  await thread.save();
}

/**
 * A simple per-minute cap, counted from the messages themselves rather than held in
 * memory — the API may run as more than one process, and a limit that resets when a
 * process restarts is not a limit.
 */
async function assertNotFlooding(userId: string): Promise<void> {
  const since = new Date(Date.now() - 60_000);
  const recent = await ChatMessageModel.countDocuments({
    senderId: userId,
    createdAt: mongoose.trusted({ $gte: since }),
  });

  if (recent >= MESSAGES_PER_MINUTE) {
    throw new AppError('RATE_LIMITED', 'You are sending messages very quickly. Wait a moment.', {
      retryAfterSeconds: 60,
    });
  }
}

/** `unread` is a Map on a hydrated document and a plain object on a lean one. */
function readUnread(unread: unknown, userId: string): number {
  if (unread instanceof Map) return unread.get(userId) ?? 0;
  if (unread && typeof unread === 'object') {
    return (unread as Record<string, number>)[userId] ?? 0;
  }
  return 0;
}

const isDuplicate = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
