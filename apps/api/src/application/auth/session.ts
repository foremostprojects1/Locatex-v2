import { ulid } from 'ulid';
import { loginSchema, type LoginInput, type SessionUser } from '@locatex/contracts';
import { UserModel, isFullyVerified, type UserDoc } from '../../infrastructure/db/models/User.js';
import { AuthTokenModel } from '../../infrastructure/db/models/AuthToken.js';
import { verifyPassword, wasteVerificationTime } from '../../infrastructure/auth/password.js';
import {
  createRefreshToken,
  hashToken,
  signAccessToken,
} from '../../infrastructure/auth/tokens.js';
import { AppError } from '../../shared/AppError.js';

export interface SessionContext {
  userAgent?: string;
  ip?: string;
  refreshTtlDays: number;
}

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

/** The only shape a user is ever returned in — no hash, no tokens, no internal stamps. */
export function toSessionUser(user: UserDoc): SessionUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    avatarUrl: user.avatarUrl ?? null,
    brokerApplicationStatus: user.brokerApplication?.status ?? (user.role === 'broker' ? 'approved' : 'none'),
  };
}

async function issueSession(
  user: UserDoc,
  context: SessionContext,
  familyId = ulid(),
): Promise<IssuedSession> {
  const refreshToken = createRefreshToken();

  await AuthTokenModel.create({
    userId: user.id,
    kind: 'refresh',
    tokenHash: hashToken(refreshToken),
    familyId,
    expiresAt: new Date(Date.now() + context.refreshTtlDays * 86_400_000),
    userAgent: context.userAgent ?? null,
    ip: context.ip ?? null,
  });

  const accessToken = await signAccessToken({
    userId: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  return { accessToken, refreshToken, user: toSessionUser(user) };
}

/**
 * Sign in with an email address or a mobile number.
 *
 * A wrong password and an unknown account produce the same message and take the same time,
 * so this endpoint cannot be used to discover who has an account.
 */
export async function login(input: LoginInput, context: SessionContext): Promise<IssuedSession> {
  const { identifier, password } = loginSchema.parse(input);
  const normalised = identifier.trim().toLowerCase();
  const asPhone = normalised.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '');

  const user = await UserModel.findOne({
    deletedAt: null,
    $or: [{ email: normalised }, { phone: asPhone }],
  }).select('+passwordHash');

  if (!user) {
    await wasteVerificationTime();
    throw new AppError('UNAUTHENTICATED', 'That email or password is not correct.');
  }

  const correct = await verifyPassword(password, user.passwordHash);
  if (!correct) {
    throw new AppError('UNAUTHENTICATED', 'That email or password is not correct.');
  }

  if (user.status === 'suspended') {
    throw new AppError('FORBIDDEN', 'This account has been deactivated. Contact support.');
  }

  // Both channels must be confirmed before a session exists. Saying which one is missing is
  // safe here — the password was already correct, so this is the account's owner.
  if (!isFullyVerified(user)) {
    throw new AppError(
      user.emailVerifiedAt ? 'PHONE_NOT_VERIFIED' : 'EMAIL_NOT_VERIFIED',
      user.emailVerifiedAt
        ? 'Confirm your mobile number to finish setting up your account.'
        : 'Confirm your email address to finish setting up your account.',
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  return issueSession(user, context);
}

/**
 * Rotates a refresh token: the presented one is spent and a successor issued.
 *
 * If a token that was already spent comes back, either it leaked or a client replayed it.
 * Both are treated the same way — the whole family is revoked, ending every session
 * descended from that login. A legitimate user signs in again; an attacker loses the
 * stolen token's value.
 */
export async function refreshSession(
  presentedToken: string,
  context: SessionContext,
): Promise<IssuedSession> {
  const record = await AuthTokenModel.findOne({
    kind: 'refresh',
    tokenHash: hashToken(presentedToken),
  });

  if (!record) throw new AppError('SESSION_EXPIRED', 'Your session has ended. Please sign in.');

  if (record.usedAt || record.revokedAt) {
    await AuthTokenModel.updateMany(
      { familyId: record.familyId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'reuse-detected' } },
    );
    throw new AppError('SESSION_EXPIRED', 'Your session has ended. Please sign in.');
  }

  if (record.expiresAt.getTime() < Date.now()) {
    throw new AppError('SESSION_EXPIRED', 'Your session has ended. Please sign in.');
  }

  const user = await UserModel.findOne({ _id: record.userId, deletedAt: null });
  if (!user || user.status === 'suspended') {
    throw new AppError('SESSION_EXPIRED', 'Your session has ended. Please sign in.');
  }

  const next = await issueSession(user, context, record.familyId ?? ulid());

  record.usedAt = new Date();
  record.replacedBy = hashToken(next.refreshToken);
  await record.save();

  return next;
}

/** Ends this one session. Other devices keep working. */
export async function logout(presentedToken: string | undefined): Promise<void> {
  if (!presentedToken) return;
  await AuthTokenModel.updateOne(
    { kind: 'refresh', tokenHash: hashToken(presentedToken), revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: 'logout' } },
  );
}

/**
 * Ends every session everywhere. Raising the token version invalidates access tokens that
 * have not expired yet, which a refresh-token revocation alone would not do.
 */
export async function logoutEverywhere(userId: string, reason: string): Promise<void> {
  await AuthTokenModel.updateMany(
    { userId, kind: 'refresh', revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } },
  );
  await UserModel.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}
