import { OTP_MAX_ATTEMPTS } from '@locatex/contracts';
import { AuthTokenModel } from '../../infrastructure/db/models/AuthToken.js';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { hashToken } from '../../infrastructure/auth/tokens.js';
import { AppError } from '../../shared/AppError.js';
import { issuePhoneOtp, type RegisterDeps } from './registerUser.js';

/** Confirms the emailed link. Idempotent: verifying twice is not an error worth showing. */
export async function verifyEmail(token: string): Promise<{ userId: string }> {
  const record = await AuthTokenModel.findOne({
    kind: 'email-verify',
    tokenHash: hashToken(token),
  });

  if (!record || record.revokedAt) {
    throw new AppError('VALIDATION_FAILED', 'This verification link is not valid.');
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new AppError(
      'VALIDATION_FAILED',
      'This verification link has expired. Request a new one from the sign-in page.',
    );
  }

  await UserModel.updateOne(
    { _id: record.userId, emailVerifiedAt: null },
    { $set: { emailVerifiedAt: new Date() } },
  );
  record.usedAt ??= new Date();
  await record.save();

  return { userId: record.userId };
}

/** Sends a fresh OTP to an unverified number — the "resend code" button. */
export async function resendPhoneOtp(phone: string, deps: RegisterDeps): Promise<void> {
  const user = await UserModel.findOne({ phone, deletedAt: null }).select('phone phoneVerifiedAt').lean();
  // Silence on an unknown number: this endpoint is unauthenticated, and answering
  // truthfully would turn it into a way to test which numbers are registered.
  if (!user || user.phoneVerifiedAt) return;
  await issuePhoneOtp(String(user._id), phone, deps);
}

/**
 * Checks a code against the newest live OTP for that number. Each wrong guess costs one of
 * a small budget; spending the budget burns the code, so an attacker gets five tries per
 * code rather than a million.
 */
export async function verifyPhoneOtp(phone: string, code: string): Promise<{ userId: string }> {
  const user = await UserModel.findOne({ phone, deletedAt: null }).select('_id phoneVerifiedAt').lean();
  if (!user) throw new AppError('OTP_INVALID', 'That code is not valid.');

  const record = await AuthTokenModel.findOne({
    userId: String(user._id),
    kind: 'phone-otp',
    usedAt: null,
    revokedAt: null,
  }).sort({ createdAt: -1 });

  if (!record) throw new AppError('OTP_INVALID', 'That code is not valid. Request a new one.');

  if (record.expiresAt.getTime() < Date.now()) {
    throw new AppError('OTP_EXPIRED', 'That code has expired. Request a new one.');
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    throw new AppError('OTP_INVALID', 'Too many attempts. Request a new code.');
  }

  if (record.tokenHash !== hashToken(code)) {
    record.attempts += 1;
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      record.revokedAt = new Date();
      record.revokedReason = 'too-many-attempts';
    }
    await record.save();
    throw new AppError('OTP_INVALID', 'That code is not correct.');
  }

  record.usedAt = new Date();
  await record.save();
  await UserModel.updateOne(
    { _id: user._id, phoneVerifiedAt: null },
    { $set: { phoneVerifiedAt: new Date() } },
  );

  return { userId: String(user._id) };
}
