import { EMAIL_JOB, deliverQueuedEmail } from './mailer.js';
import { registerHandler } from '../../infrastructure/queue/worker.js';
import { getQueue } from '../../infrastructure/queue/queues.js';
import { sendUnreadDigests } from '../chat/unreadDigest.js';
import { notifier } from '../../container.js';
import type { EmailMessage } from '../ports/notifications.js';

/**
 * Wires the email job into the worker process. Called from `worker.ts` only — the API
 * process queues messages, the worker delivers them, and neither needs the other's half.
 */
export function registerEmailHandler(): void {
  registerHandler('email', EMAIL_JOB, async (job) =>
    deliverQueuedEmail(
      job.data as {
        logId: string;
        to: string;
        template: EmailMessage['template'];
        data: Record<string, string>;
      },
    ),
  );

  registerHandler('chatDigest', UNREAD_DIGEST_JOB, async () => sendUnreadDigests(notifier()));
}

export const UNREAD_DIGEST_JOB = 'unread-digest';

/**
 * Runs the digest every hour rather than once a day.
 *
 * Each message has its own 24-hour clock, so a single daily run would tell somebody about
 * a message 24 hours late in the best case and 48 in the worst. Hourly costs one cheap
 * query and makes "a day" mean a day. The repeatable job carries a fixed id, so restarting
 * the worker replaces the schedule instead of adding a second one.
 */
export async function scheduleUnreadDigest(): Promise<void> {
  await getQueue('chatDigest').add(
    UNREAD_DIGEST_JOB,
    {},
    {
      repeat: { pattern: '7 * * * *' },
      jobId: 'unread-digest-hourly',
      removeOnComplete: { count: 24 },
    },
  );
}
