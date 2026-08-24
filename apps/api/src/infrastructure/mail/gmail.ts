import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../observability/logger.js';
import type { RenderedEmail } from './templates.js';

/**
 * Sending, over Gmail's SMTP with an app password (decision D6).
 *
 * An app password is a sixteen-character credential a Google account with two-factor
 * authentication issues for one application. The real account password never enters the
 * environment, and revoking this one costs nothing but a redeploy.
 *
 * The transport is created once and reused: Gmail counts connections as well as messages,
 * and opening one per email is how an account gets rate-limited for reasons that look
 * nothing like the number of emails sent.
 */
export interface SendResult {
  messageId: string | null;
  accepted: string[];
  rejected: string[];
}

export interface MailTransport {
  send(message: {
    to: string;
    from: string;
    replyTo?: string;
    rendered: RenderedEmail;
  }): Promise<SendResult>;
}

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  const config = env();
  transporter ??= nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth:
      config.SMTP_USER && config.SMTP_PASSWORD
        ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD }
        : undefined,
    // Gmail's SMTP is happy with a small pool and unhappy with a burst of connections.
    pool: true,
    maxConnections: 2,
    maxMessages: 100,
  });
  return transporter;
}

export class SmtpTransport implements MailTransport {
  async send(message: {
    to: string;
    from: string;
    replyTo?: string;
    rendered: RenderedEmail;
  }): Promise<SendResult> {
    const info = await getTransporter().sendMail({
      to: message.to,
      from: message.from,
      replyTo: message.replyTo,
      subject: message.rendered.subject,
      text: message.rendered.text,
      html: message.rendered.html,
    });

    return {
      messageId: info.messageId ?? null,
      accepted: (info.accepted ?? []).map(String),
      rejected: (info.rejected ?? []).map(String),
    };
  }
}

/**
 * What runs when no SMTP host is configured: development, and every test.
 *
 * It logs the subject and recipient rather than the body — a verification link in a log
 * file is a credential in a log file.
 */
export class LoggingTransport implements MailTransport {
  readonly sent: Array<{ to: string; subject: string }> = [];

  async send(message: { to: string; rendered: RenderedEmail }): Promise<SendResult> {
    this.sent.push({ to: message.to, subject: message.rendered.subject });
    logger.info(
      { to: message.to, subject: message.rendered.subject },
      'email not sent — no SMTP host configured',
    );
    return { messageId: null, accepted: [message.to], rejected: [] };
  }
}

/** Chosen by configuration, not by `NODE_ENV`: a staging box may deliberately not send. */
export function createTransport(): MailTransport {
  return env().SMTP_HOST ? new SmtpTransport() : new LoggingTransport();
}

/** Tests and a restart after a credential change both need the pool dropped. */
export function resetTransport(): void {
  transporter?.close();
  transporter = undefined;
}
