import { RESET_TOKEN_TTL_MINUTES } from '@locatex/contracts';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { AuthTokenModel } from '../../infrastructure/db/models/AuthToken.js';
import { hashPassword, verifyPassword } from '../../infrastructure/auth/password.js';
import { createUrlToken, hashToken } from '../../infrastructure/auth/tokens.js';
import { AppError } from '../../shared/AppError.js';
import { logoutEverywhere } from './session.js';
import type { EmailSender } from '../ports/notifications.js';

/**
 * Changing a password signs every other device out. Someone who changes their password
 * usually believes a session is compromised, and leaving those sessions alive defeats the
 * point of changing it.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  email: EmailSender,
): Promise<void> {
  const user = await UserModel.findOne({ _id: userId, deletedAt: null }).select('+passwordHash email fullName');
  if (!user) throw AppError.notFound('Account');

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AppError('VALIDATION_FAILED', 'Your current password is not correct.', {
      details: [{ field: 'currentPassword', code: 'INCORRECT', message: 'Not correct' }],
    });
  }

  if (await verifyPassword(newPassword, user.passwordHash)) {
    throw new AppError('VALIDATION_FAILED', 'Choose a password you have not used here before.', {
      details: [{ field: 'newPassword', code: 'REUSED', message: 'Same as your current password' }],
    });
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await logoutEverywhere(userId, 'password-changed');

  await email.send({
    to: user.email,
    template: 'password-changed',
    data: { fullName: user.fullName },
  });
}

/**
 * Always answers the same way, whether or not the address is registered — otherwise this
 * endpoint becomes a way to enumerate customers.
 */
export async function requestPasswordReset(
  emailAddress: string,
  deps: { email: EmailSender; appBaseUrl: string },
): Promise<void> {
  const user = await UserModel.findOne({ email: emailAddress, deletedAt: null }).select('email fullName');
  if (!user) return;

  await AuthTokenModel.updateMany(
    { userId: user.id, kind: 'password-reset', usedAt: null, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: 'superseded' } },
  );

  const token = createUrlToken();
  await AuthTokenModel.create({
    userId: user.id,
    kind: 'password-reset',
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000),
  });

  await deps.email.send({
    to: user.email,
    template: 'reset-password',
    data: {
      fullName: user.fullName,
      url: `${deps.appBaseUrl}/reset-password?token=${token}`,
      minutes: String(RESET_TOKEN_TTL_MINUTES),
    },
  });
}

/** Completing a reset also ends every existing session, for the same reason as a change. */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const record = await AuthTokenModel.findOne({
    kind: 'password-reset',
    tokenHash: hashToken(token),
  });

  if (!record || record.usedAt || record.revokedAt) {
    throw new AppError('VALIDATION_FAILED', 'This reset link is not valid. Request a new one.');
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new AppError('VALIDATION_FAILED', 'This reset link has expired. Request a new one.');
  }

  const user = await UserModel.findOne({ _id: record.userId, deletedAt: null }).select('+passwordHash');
  if (!user) throw new AppError('VALIDATION_FAILED', 'This reset link is not valid.');

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  record.usedAt = new Date();
  await record.save();

  await logoutEverywhere(user.id, 'password-reset');
}
