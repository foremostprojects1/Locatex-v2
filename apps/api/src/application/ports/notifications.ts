import { logger } from '../../infrastructure/observability/logger.js';

/**
 * Outbound notifications as ports, so use cases never import a provider SDK. Phase 8
 * replaces the development implementations with queued Gmail sends and real templates;
 * nothing above this line changes when it does.
 */
export interface EmailMessage {
  to: string;
  template:
    | 'verify-email'
    | 'reset-password'
    | 'password-changed'
    | 'broker-approved'
    | 'broker-rejected'
    | 'property-submitted'
    | 'property-approved'
    | 'property-rejected'
    | 'contact-received'
    | 'contact-acknowledged';
  data: Record<string, string>;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

export interface SmsMessage {
  to: string;
  template: 'phone-otp';
  data: Record<string, string>;
}

export interface SmsSender {
  send(message: SmsMessage): Promise<void>;
}

/**
 * Development and test implementation: logs instead of sending. The OTP is logged at info
 * so a developer can complete a signup locally without an SMS provider — which is also why
 * this must never be the implementation in production.
 */
export class LoggingNotifier implements EmailSender, SmsSender {
  private readonly sent: Array<EmailMessage | SmsMessage> = [];

  async send(message: EmailMessage | SmsMessage): Promise<void> {
    this.sent.push(message);
    logger.info({ to: message.to, template: message.template, data: message.data }, 'notification (not sent — development sender)');
  }

  /** Test helper: what would have gone out. */
  outbox(): ReadonlyArray<EmailMessage | SmsMessage> {
    return this.sent;
  }

  clear(): void {
    this.sent.length = 0;
  }
}
