import { z } from 'zod';

/**
 * What a buyer does with a listing once they have found it: keep it, and ask about it.
 */

export const ENQUIRY_CHANNELS = ['message', 'callback', 'visit'] as const;
export const enquiryChannelSchema = z.enum(ENQUIRY_CHANNELS);
export type EnquiryChannel = z.infer<typeof enquiryChannelSchema>;

export const ENQUIRY_CHANNEL_LABEL: Record<EnquiryChannel, string> = {
  message: 'Send a message',
  callback: 'Ask them to call me',
  visit: 'Arrange a site visit',
};

export const ENQUIRY_STATUSES = ['new', 'read', 'replied', 'closed'] as const;
export const enquiryStatusSchema = z.enum(ENQUIRY_STATUSES);
export type EnquiryStatus = z.infer<typeof enquiryStatusSchema>;

/**
 * The message a buyer sends a broker about a listing.
 *
 * A minimum length is enforced because "interested" tells a broker nothing and wastes a
 * phone call; the placeholder in the form asks for what the broker actually needs to know.
 */
export const enquirySchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(15, 'Tell the broker what you would like to know')
      .max(1500, 'Please keep it under 1,500 characters'),
    channel: enquiryChannelSchema.default('message'),
    /** Optional: a buyer may want a callback on a different number than they registered. */
    callbackPhone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number')
      .optional(),
  })
  .strict();

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const favouriteListQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(100).default(24),
    cursor: z.string().max(200).optional(),
  })
  .strict();
