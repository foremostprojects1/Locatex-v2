import mongoose from 'mongoose';
import { UNREAD_DIGEST_AFTER_HOURS } from '@locatex/contracts';
import { ChatThreadModel } from '../../infrastructure/db/models/Chat.js';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { logger } from '../../infrastructure/observability/logger.js';
import type { EmailSender } from '../ports/notifications.js';

/**
 * "Somebody messaged you a day ago and you have not looked."
 *
 * The brief asks for this, and it is the one email in the system that is easy to get wrong
 * in a way that loses a customer. Three rules keep it honest:
 *
 *   - It is sent once per conversation per silence. `digestSentAt` is stamped when it goes
 *     out and cleared by the next new message, so a conversation that stays unread for a
 *     week produces one email, not seven.
 *   - Everything unread is gathered into a single email per person. Somebody with four
 *     unanswered conversations gets one message, not four.
 *   - A blocked conversation never counts. The recipient's unread total does not move when
 *     a blocked person writes, so there is nothing here to remind them of.
 */
export async function sendUnreadDigests(
  email: EmailSender,
  now: Date = new Date(),
): Promise<{ people: number; threads: number }> {
  const cutoff = new Date(now.getTime() - UNREAD_DIGEST_AFTER_HOURS * 60 * 60 * 1000);

  const candidates = await ChatThreadModel.find({
    lastMessageAt: mongoose.trusted({ $lte: cutoff, $ne: null }),
    digestSentAt: null,
  })
    .limit(2_000)
    .lean();

  // Group by the person who has not read, not by thread.
  const byPerson = new Map<string, string[]>();

  for (const thread of candidates) {
    const unread = thread.unread as unknown as Record<string, number> | Map<string, number>;
    for (const participant of [thread.brokerId, thread.buyerId]) {
      const count = unread instanceof Map ? unread.get(participant) : unread?.[participant];
      if (!count) continue;
      // The sender of the last message is not waiting on themselves.
      if (thread.lastSenderId === participant) continue;

      const list = byPerson.get(participant) ?? [];
      list.push(String(thread._id));
      byPerson.set(participant, list);
    }
  }

  if (byPerson.size === 0) return { people: 0, threads: 0 };

  const people = await UserModel.find({
    _id: mongoose.trusted({ $in: [...byPerson.keys()] }),
    status: 'active',
    deletedAt: null,
  })
    .select('fullName email')
    .lean();

  let threadCount = 0;

  for (const person of people) {
    const threadIds = byPerson.get(String(person._id)) ?? [];
    if (threadIds.length === 0) continue;

    try {
      await email.send({
        to: person.email,
        template: 'chat-unread-digest',
        data: { fullName: person.fullName, count: String(threadIds.length) },
        // One digest per person per day, even if the job runs twice.
        dedupeKey: `unread-${now.toISOString().slice(0, 10)}`,
      });

      await ChatThreadModel.updateMany(
        { _id: mongoose.trusted({ $in: threadIds }) },
        { $set: { digestSentAt: now } },
      );
      threadCount += threadIds.length;
    } catch (error) {
      // One person's failure must not stop everyone else's digest.
      logger.error({ err: error, userId: String(person._id) }, 'unread digest failed');
    }
  }

  logger.info({ people: people.length, threads: threadCount }, 'unread digests sent');
  return { people: people.length, threads: threadCount };
}
