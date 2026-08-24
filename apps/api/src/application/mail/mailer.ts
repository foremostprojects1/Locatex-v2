import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { EmailLogModel } from '../../infrastructure/db/models/EmailLog.js';
import { logger } from '../../infrastructure/observability/logger.js';
import { getQueue } from '../../infrastructure/queue/queues.js';
import {
  createTransport,
  type MailTransport,
} from '../../infrastructure/mail/gmail.js';
import { renderEmail, type TemplateContext } from '../../infrastructure/mail/templates.js';
import type { EmailMessage, EmailSender } from '../ports/notifications.js';

/**
 * Sending mail, properly.
 *
 * Two things happen that a direct `sendMail` call cannot do. The message is written to the
 * log *before* it is handed to the queue, so a message that is never delivered is still a
 * message someone can find and re-send; and the day's volume is counted before each send,
 * because Gmail's ~500/day ceiling is enforced by locking the account rather than by
 * refusing one message.
 *
 * Callers see only `EmailSender.send`, unchanged since Phase 2 — nothing above this line
 * knows a queue exists.
 */

export const EMAIL_JOB = 'send';

/** Messages that must go out even at the daily ceiling: someone is waiting on them. */
const CRITICAL: ReadonlyArray<EmailMessage['template']> = [
  'verify-email',
  'reset-password',
  'password-changed',
];

function context(): TemplateContext {
  const config = env();
  return {
    appBaseUrl: config.APP_BASE_URL,
    brandName: config.MAIL_FROM_NAME,
    supportEmail: config.MAIL_REPLY_TO ?? config.MAIL_FROM ?? 'support@locatex.in',
  };
}

/** How many we have sent in the last 24 hours — the number Gmail is also counting. */
export async function sentInLastDay(): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return EmailLogModel.countDocuments({
    status: 'sent',
    sentAt: mongoose.trusted({ $gte: since }),
  });
}

/**
 * The queueing mailer.
 *
 * `send` returns as soon as the message is logged and queued: an approval must not be slow
 * because a mail server is, and must not fail because one is down.
 */
export class QueuedMailer implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    const rendered = renderEmail(message.template, message.data, context());

    let logId: string;
    try {
      const record = await EmailLogModel.create({
        to: message.to,
        template: message.template,
        subject: rendered.subject,
        status: 'queued',
        ...(message.dedupeKey ? { dedupeKey: message.dedupeKey } : {}),
      });
      logId = record.id;
    } catch (error) {
      // The unique index on (template, to, dedupeKey) rejected it: this exact message has
      // already been queued once. That is the index doing its job, not a failure.
      if (isDuplicate(error)) {
        logger.debug(
          { to: message.to, template: message.template },
          'email suppressed — already queued with this dedupe key',
        );
        return;
      }
      throw error;
    }

    await getQueue('email').add(
      EMAIL_JOB,
      { logId, to: message.to, template: message.template, data: message.data },
      { jobId: logId },
    );
  }
}

/**
 * Renders and delivers one queued message. Called by the worker, and directly by tests.
 *
 * Throwing is meaningful here: BullMQ retries a failed job with backoff, so a mail server
 * that is briefly down costs a delay rather than a lost email.
 */
export async function deliverQueuedEmail(
  payload: { logId: string; to: string; template: EmailMessage['template']; data: Record<string, string> },
  transport: MailTransport = createTransport(),
): Promise<{ delivered: boolean; reason?: string }> {
  const config = env();
  const record = await EmailLogModel.findById(payload.logId);
  if (!record) return { delivered: false, reason: 'no log entry' };
  if (record.status === 'sent') return { delivered: false, reason: 'already sent' };

  // The ceiling. Critical mail goes anyway — locking someone out of their own account to
  // protect a quota is the wrong trade — but everything else waits for tomorrow.
  if (!CRITICAL.includes(payload.template)) {
    const today = await sentInLastDay();
    if (today >= config.EMAIL_DAILY_LIMIT) {
      record.status = 'suppressed';
      record.suppressedReason = `daily limit of ${config.EMAIL_DAILY_LIMIT} reached`;
      await record.save();
      logger.error(
        { template: payload.template, today, limit: config.EMAIL_DAILY_LIMIT },
        'daily email limit reached — message suppressed',
      );
      return { delivered: false, reason: 'daily limit reached' };
    }
    if (today === config.EMAIL_DAILY_WARN_AT) {
      logger.warn({ today, limit: config.EMAIL_DAILY_LIMIT }, 'approaching the daily email limit');
    }
  }

  const rendered = renderEmail(payload.template, payload.data, context());
  record.attempts += 1;

  try {
    const result = await transport.send({
      to: payload.to,
      from: `${config.MAIL_FROM_NAME} <${config.MAIL_FROM ?? config.SMTP_USER ?? 'no-reply@locatex.in'}>`,
      replyTo: config.MAIL_REPLY_TO,
      rendered,
    });

    if (result.rejected.length > 0) {
      throw new Error(`the server rejected ${result.rejected.join(', ')}`);
    }

    record.status = 'sent';
    record.sentAt = new Date();
    record.providerMessageId = result.messageId;
    record.error = null;
    await record.save();

    return { delivered: true };
  } catch (error) {
    record.status = 'failed';
    record.error = error instanceof Error ? error.message : String(error);
    await record.save();
    throw error;
  }
}

const isDuplicate = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
