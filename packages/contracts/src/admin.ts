import { z } from 'zod';
import { emailSchema, phoneSchema } from './auth.js';

/**
 * The contact form, the timed news items, and the shapes the admin dashboard reads.
 * Shared so the dashboard and the API agree on what a valid news window is without either
 * one restating it.
 */

// ---------------------------------------------------------------------------
// Contact us
// ---------------------------------------------------------------------------

export const CONTACT_SUBJECTS = [
  'general',
  'listing',
  'broker',
  'complaint',
  'other',
] as const;
export const contactSubjectSchema = z.enum(CONTACT_SUBJECTS);

export const CONTACT_SUBJECT_LABEL: Record<(typeof CONTACT_SUBJECTS)[number], string> = {
  general: 'General enquiry',
  listing: 'About a listing',
  broker: 'Becoming a broker',
  complaint: 'A complaint',
  other: 'Something else',
};

export const contactMessageSchema = z
  .object({
    name: z.string().trim().min(2, 'Tell us your name').max(80),
    email: emailSchema,
    phone: phoneSchema.optional(),
    subject: contactSubjectSchema.default('general'),
    /** Which listing they were looking at, when they wrote from a property page. */
    propertyId: z.string().trim().max(40).optional(),
    message: z
      .string()
      .trim()
      .min(10, 'A few more words, so we can help properly')
      .max(2000, 'Please keep it under 2,000 characters'),
  })
  .strict();

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

export const CONTACT_STATUSES = ['new', 'read', 'replied', 'closed'] as const;
export const contactStatusSchema = z.enum(CONTACT_STATUSES);
export type ContactStatus = z.infer<typeof contactStatusSchema>;

// ---------------------------------------------------------------------------
// News and advertisements
// ---------------------------------------------------------------------------

/**
 * A news item or advertisement that appears between two dates.
 *
 * The window is stored, not a computed "is it live" flag: a flag has to be flipped by
 * something, and whatever is meant to flip it will one day not run. A start and an end are
 * true whether or not any job is working.
 */
export const newsItemSchema = z
  .object({
    title: z.string().trim().min(4, 'Give it a headline').max(120),
    body: z.string().trim().min(10).max(4000),
    imageUrl: z.string().url().max(500).optional(),
    linkUrl: z.string().url().max(500).optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().optional(),
    isActive: z.boolean().default(true),
    /** Pinned items lead the list regardless of date. */
    isPinned: z.boolean().default(false),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.endsAt && value.endsAt <= value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'The end has to come after the start',
      });
    }
  });

export type NewsItemInput = z.infer<typeof newsItemSchema>;

/** Every field optional for an edit, and the same window rule when both are supplied. */
export const newsItemUpdateSchema = newsItemSchema.innerType().partial().strict();

/**
 * Whether an item should be on the page right now. Written once here so the admin preview,
 * the public endpoint and any future digest all answer it identically.
 */
export function isNewsLive(
  item: { isActive: boolean; startsAt: Date | string; endsAt?: Date | string | null },
  now: Date = new Date(),
): boolean {
  if (!item.isActive) return false;
  if (new Date(item.startsAt) > now) return false;
  if (item.endsAt && new Date(item.endsAt) <= now) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const USER_STATUSES = ['active', 'suspended'] as const;
export const userStatusSchema = z.enum(USER_STATUSES);

export const adminUserQuerySchema = z
  .object({
    role: z.enum(['buyer', 'broker', 'admin']).optional(),
    status: userStatusSchema.optional(),
    q: z.string().trim().min(2).max(80).optional(),
    limit: z.coerce.number().int().positive().max(100).default(25),
    cursor: z.string().max(200).optional(),
  })
  .strict();

export interface AdminStats {
  listings: Record<string, number>;
  pendingApprovals: number;
  users: Record<string, number>;
  contactMessages: { new: number; total: number };
  brokerApplications: number;
}
