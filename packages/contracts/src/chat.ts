import { z } from 'zod';

/**
 * Messages between a buyer and a broker about one listing.
 *
 * Contact details are **not** masked (a decision the client made explicitly): people swap
 * phone numbers here and that is fine, because the alternative — rewriting what someone
 * typed — breaks survey numbers, khaata numbers and prices, all of which look like phone
 * numbers to a regular expression.
 */

export const MESSAGE_MAX_LENGTH = 2000;

export const sendMessageSchema = z
  .object({
    body: z
      .string()
      .trim()
      .min(1, 'Write something first')
      .max(MESSAGE_MAX_LENGTH, `Messages are limited to ${MESSAGE_MAX_LENGTH} characters`),
    /**
     * The client's own id for the message, echoed back on the saved one. It lets a sender
     * match the message it optimistically drew to the message the server confirmed, instead
     * of showing the same line twice.
     */
    clientId: z.string().trim().max(64).optional(),
  })
  .strict();

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const startThreadSchema = z
  .object({
    propertyId: z.string().trim().min(1).max(40),
    body: z
      .string()
      .trim()
      .min(1, 'Write something first')
      .max(MESSAGE_MAX_LENGTH)
      .optional(),
  })
  .strict();

export const REPORT_REASONS = [
  'spam',
  'abusive',
  'fraud',
  'not-the-owner',
  'other',
] as const;
export const reportReasonSchema = z.enum(REPORT_REASONS);

export const REPORT_REASON_LABEL: Record<(typeof REPORT_REASONS)[number], string> = {
  spam: 'Spam or advertising',
  abusive: 'Abusive or threatening',
  fraud: 'Looks like a scam',
  'not-the-owner': 'They do not seem to own this land',
  other: 'Something else',
};

export const reportThreadSchema = z
  .object({
    reason: reportReasonSchema,
    detail: z.string().trim().max(1000).optional(),
  })
  .strict();

/**
 * How many messages one person may send in a minute.
 *
 * High enough that a real conversation never notices — people do send five short lines in
 * a row — and low enough that a script cannot fill somebody's inbox.
 */
export const MESSAGES_PER_MINUTE = 20;

/** How long a message may go unread before we email about it (the brief's 24 hours). */
export const UNREAD_DIGEST_AFTER_HOURS = 24;

export interface ChatParticipant {
  id: string;
  name: string;
  role: 'buyer' | 'broker' | 'admin';
}
