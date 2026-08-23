import { Schema, model } from 'mongoose';
import { ulid } from 'ulid';

/**
 * Every credential that is not a password: refresh sessions, email-verification links,
 * password-reset links and phone OTPs. One collection because they share a lifecycle —
 * issued, used once, expired — and a single TTL index then cleans all of them up.
 *
 * Only hashes are stored. A leaked database cannot be replayed as a session or used to
 * complete somebody's password reset.
 */
const authTokenSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },

    userId: { type: String, required: true, index: true },
    kind: {
      type: String,
      enum: ['refresh', 'email-verify', 'password-reset', 'phone-otp'],
      required: true,
    },

    /** SHA-256 of the token or OTP that was sent out. */
    tokenHash: { type: String, required: true, index: true },

    /**
     * Refresh tokens rotate: each use issues a successor and marks the parent used. All
     * tokens descended from one login share a family id, so detecting a replayed token
     * lets us revoke the entire chain rather than just the one that leaked.
     */
    familyId: { type: String, index: true },
    replacedBy: { type: String, default: null },

    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: null },

    /** OTP guessing budget; the code dies once it is spent. */
    attempts: { type: Number, default: 0 },

    /** Recorded on refresh sessions to make a stolen-token report answerable. */
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: true, strict: 'throw', versionKey: false, collection: 'auth_tokens' },
);

// Mongo removes documents once expiresAt passes, so used and expired credentials do not
// accumulate. The application still checks expiry itself — the reaper runs about once a
// minute and is a cleanup mechanism, not a security control.
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
authTokenSchema.index({ userId: 1, kind: 1, usedAt: 1 });

export const AuthTokenModel = model('AuthToken', authTokenSchema);
export type AuthTokenDoc = InstanceType<typeof AuthTokenModel>;
