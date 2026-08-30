import { z } from 'zod';
import { roleSchema } from './roles.js';

/**
 * Registration and session contracts, shared by the API (validation) and the web app
 * (form validation and types). One definition, so the two can never disagree about what a
 * valid password or phone number is.
 */

/** Indian mobile number: ten digits starting 6–9, however the user spaces or prefixes it. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, ''))
  .pipe(
    z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number'),
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254);

/**
 * Long enough to resist guessing, with no character-class rules: length beats symbols, and
 * arbitrary rules push people towards `Password1!` and a sticky note.
 */
export const PASSWORD_MIN_LENGTH = 10;
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, 'That password is too long');

/** Budget bands offered at signup; stored in paise like every other money value. */
export const BUDGET_BANDS = [
  { value: 'under-25l', label: 'Under ₹25 L', minPaise: 0, maxPaise: 2_500_000_00 },
  { value: '25l-50l', label: '₹25 L – ₹50 L', minPaise: 2_500_000_00, maxPaise: 5_000_000_00 },
  { value: '50l-1cr', label: '₹50 L – ₹1 Cr', minPaise: 5_000_000_00, maxPaise: 10_000_000_00 },
  { value: '1cr-2cr', label: '₹1 Cr – ₹2 Cr', minPaise: 10_000_000_00, maxPaise: 20_000_000_00 },
  { value: 'above-2cr', label: 'Above ₹2 Cr', minPaise: 20_000_000_00, maxPaise: null },
] as const;

export const budgetBandSchema = z.enum([
  'under-25l',
  '25l-50l',
  '50l-1cr',
  '1cr-2cr',
  'above-2cr',
]);
export type BudgetBand = z.infer<typeof budgetBandSchema>;

/**
 * Registration always creates a buyer — broker is granted later by an admin (decision D4).
 *
 * `.strict()` on purpose: an unexpected field means the client and server disagree, and
 * this project has already been bitten once by data that was accepted and silently dropped.
 * It also turns an attempt to smuggle `role: "admin"` into a visible 400 rather than a
 * quiet strip.
 */
export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(80),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  preferredDistrict: z.string().trim().min(2).max(60).optional(),
  budgetBand: budgetBandSchema.optional(),
}).strict();
export type RegisterInput = z.input<typeof registerSchema>;

/** Sign in with either identifier — v1 allowed both and users are used to it. */
export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or mobile number'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({ token: z.string().min(10) });

export const requestOtpSchema = z.object({ phone: phoneSchema });

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: passwordSchema,
});

/** Broker application — the brief's fields, RERA optional. */
export const brokerApplicationSchema = z.object({
  agencyName: z.string().trim().min(2, 'Enter your agency or business name').max(120),
  officeAddress: z.string().trim().min(10, 'Enter your office address').max(300),
  district: z.string().trim().min(2).max(60),
  reraNumber: z.string().trim().max(40).optional(),
  experienceYears: z.coerce.number().int().min(0).max(70).optional(),
  about: z.string().trim().max(1000).optional(),
});
export type BrokerApplicationInput = z.input<typeof brokerApplicationSchema>;

export const brokerDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().trim().max(500).optional(),
});

/** What `GET /auth/me` returns — never a password hash, never a token. */
export const sessionUserSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  role: roleSchema,
  status: z.enum(['active', 'suspended']),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  avatarUrl: z.string().nullable(),
  brokerApplicationStatus: z.enum(['none', 'pending', 'approved', 'rejected']),
  /** The buyer's own preferences, so the profile form can show what is currently set. */
  preferredDistrict: z.string().nullable(),
  budgetBand: budgetBandSchema.nullable(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const EMAIL_TOKEN_TTL_HOURS = 24;
export const RESET_TOKEN_TTL_MINUTES = 10;

/**
 * Editing your own account.
 *
 * The email address and the mobile number are deliberately absent: both are login
 * identifiers and both are verified, so changing one is a re-verification flow rather than
 * a form field. Doing it here would let someone move their account to an address they have
 * not proved they own.
 */
export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(80).optional(),
    avatarUrl: z.string().url().max(500).nullable().optional(),
    preferredDistrict: z.string().trim().min(2).max(60).nullable().optional(),
    budgetBand: budgetBandSchema.nullable().optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** A broker editing the details buyers see on their profile page. */
export const updateBrokerProfileSchema = z
  .object({
    agencyName: z.string().trim().min(2).max(120).optional(),
    officeAddress: z.string().trim().min(10).max(300).optional(),
    district: z.string().trim().min(2).max(60).optional(),
    reraNumber: z.string().trim().max(40).nullable().optional(),
    experienceYears: z.coerce.number().int().min(0).max(70).nullable().optional(),
    about: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();
