import { EMAIL_JOB, deliverQueuedEmail } from './mailer.js';
import { registerHandler } from '../../infrastructure/queue/worker.js';
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
}
