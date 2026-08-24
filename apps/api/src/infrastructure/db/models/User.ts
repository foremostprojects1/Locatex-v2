import { Schema, model } from 'mongoose';
import { ulid } from 'ulid';
import { ROLES } from '@locatex/contracts';

/**
 * One document per person. Buyer and broker details live in subdocuments rather than
 * separate collections: a user is one identity that gains capabilities, and the broker
 * fields simply do not exist until an application is approved (decision D4).
 *
 * `_id` is a ULID string, not an ObjectId — sortable by creation time, safe to expose in a
 * URL, and identical in shape to every other id in the system.
 */

const buyerProfileSchema = new Schema(
  {
    preferredDistrict: { type: String, trim: true },
    budgetBand: {
      type: String,
      enum: ['under-25l', '25l-50l', '50l-1cr', '1cr-2cr', 'above-2cr'],
    },
  },
  { _id: false },
);

const brokerProfileSchema = new Schema(
  {
    agencyName: { type: String, trim: true, required: true },
    officeAddress: { type: String, trim: true, required: true },
    district: { type: String, trim: true, required: true },
    reraNumber: { type: String, trim: true },
    experienceYears: { type: Number, min: 0, max: 70 },
    about: { type: String, trim: true, maxlength: 1000 },

    /** Set when an admin approves; the role change and this stamp happen together. */
    approvedAt: { type: Date },
    approvedBy: { type: String },
  },
  { _id: false },
);

const brokerApplicationSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      required: true,
      default: 'pending',
    },
    agencyName: { type: String, trim: true, required: true },
    officeAddress: { type: String, trim: true, required: true },
    district: { type: String, trim: true, required: true },
    reraNumber: { type: String, trim: true },
    experienceYears: { type: Number, min: 0, max: 70 },
    about: { type: String, trim: true, maxlength: 1000 },
    submittedAt: { type: Date, required: true, default: () => new Date() },
    decidedAt: { type: Date },
    decidedBy: { type: String },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },

    fullName: { type: String, trim: true, required: true, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true, required: true },
    phone: { type: String, trim: true, required: true },

    /** bcrypt, so hashes migrated from v1 keep verifying without forcing a password reset. */
    passwordHash: { type: String, required: true, select: false },

    role: { type: String, enum: ROLES, required: true, default: 'buyer', index: true },
    status: { type: String, enum: ['active', 'suspended'], required: true, default: 'active' },

    /**
     * Bumped on password change, on logout-everywhere and when an admin suspends an
     * account. Access tokens carry the value they were minted with, so raising it
     * invalidates every token already in circulation without a blocklist.
     */
    tokenVersion: { type: Number, required: true, default: 0 },

    emailVerifiedAt: { type: Date, default: null },
    phoneVerifiedAt: { type: Date, default: null },

    avatarUrl: { type: String, default: null },
    lastLoginAt: { type: Date, default: null },

    buyerProfile: { type: buyerProfileSchema, default: () => ({}) },
    brokerProfile: { type: brokerProfileSchema, default: null },
    brokerApplication: { type: brokerApplicationSchema, default: null },

    deletedAt: { type: Date, default: null },

    /** The v1 `_id` this account came from, so re-running the import updates in place. */
    legacyId: { type: String, default: null },
  },
  {
    timestamps: true,
    strict: 'throw',
    versionKey: false,
    collection: 'users',
  },
);

// Email and phone are both login identifiers, so both must be unique. Partial filters keep
// soft-deleted accounts from blocking a re-registration with the same address.
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
userSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
userSchema.index({ 'brokerApplication.status': 1, 'brokerApplication.submittedAt': -1 });
userSchema.index(
  { legacyId: 1 },
  { unique: true, partialFilterExpression: { legacyId: { $type: 'string' } } },
);

export const UserModel = model('User', userSchema);

/**
 * Derived from the model rather than from the schema: `InferSchemaType` produces a
 * structurally identical but distinct type, which TypeScript then refuses to unify with
 * whatever `findOne()` returns.
 */
export type UserDoc = InstanceType<typeof UserModel>;

/** True once both channels are verified — the gate on signing in (decision: both mandatory). */
export const isFullyVerified = (user: {
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
}): boolean => Boolean(user.emailVerifiedAt && user.phoneVerifiedAt);
