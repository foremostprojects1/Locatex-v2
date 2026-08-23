import {
  EMAIL_TOKEN_TTL_HOURS,
  OTP_TTL_MINUTES,
  registerSchema,
  type RegisterInput,
} from '@locatex/contracts';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { AuthTokenModel } from '../../infrastructure/db/models/AuthToken.js';
import { hashPassword } from '../../infrastructure/auth/password.js';
import { createOtp, createUrlToken, hashToken } from '../../infrastructure/auth/tokens.js';
import { AppError } from '../../shared/AppError.js';
import type { EmailSender, SmsSender } from '../ports/notifications.js';

export interface RegisterDeps {
  email: EmailSender;
  sms: SmsSender;
  appBaseUrl: string;
}

/**
 * Creates a buyer account. Everyone starts as a buyer; broker is granted later by an admin
 * (decision D4), so `role` is never taken from the request.
 *
 * Both an email link and a phone OTP are issued here, because both channels must be
 * verified before the account can sign in.
 */
export async function registerUser(input: RegisterInput, deps: RegisterDeps) {
  const data = registerSchema.parse(input);

  const clash = await UserModel.findOne({
    deletedAt: null,
    $or: [{ email: data.email }, { phone: data.phone }],
  })
    .select('email phone')
    .lean();

  if (clash) {
    // Which field clashed is safe to say: both are things the person just typed about
    // themselves, and hiding it only makes the form impossible to correct.
    throw new AppError(
      'CONFLICT',
      clash.email === data.email
        ? 'An account already exists with this email address.'
        : 'An account already exists with this mobile number.',
      {
        details: [
          {
            field: clash.email === data.email ? 'email' : 'phone',
            code: 'ALREADY_REGISTERED',
            message: 'Already registered. Try signing in instead.',
          },
        ],
      },
    );
  }

  const user = await UserModel.create({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    passwordHash: await hashPassword(data.password),
    role: 'buyer',
    buyerProfile: {
      preferredDistrict: data.preferredDistrict,
      budgetBand: data.budgetBand,
    },
  });

  await issueEmailVerification(user.id, data.email, data.fullName, deps);
  await issuePhoneOtp(user.id, data.phone, deps);

  return { userId: user.id };
}

export async function issueEmailVerification(
  userId: string,
  email: string,
  fullName: string,
  deps: RegisterDeps,
): Promise<void> {
  const token = createUrlToken();
  await AuthTokenModel.create({
    userId,
    kind: 'email-verify',
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_HOURS * 3600_000),
  });

  await deps.email.send({
    to: email,
    template: 'verify-email',
    data: {
      fullName,
      url: `${deps.appBaseUrl}/verify-email?token=${token}`,
      hours: String(EMAIL_TOKEN_TTL_HOURS),
    },
  });
}

export async function issuePhoneOtp(
  userId: string,
  phone: string,
  deps: RegisterDeps,
): Promise<void> {
  // Any earlier code for this number stops working the moment a new one is sent.
  await AuthTokenModel.updateMany(
    { userId, kind: 'phone-otp', usedAt: null, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: 'superseded' } },
  );

  const code = createOtp();
  await AuthTokenModel.create({
    userId,
    kind: 'phone-otp',
    tokenHash: hashToken(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
  });

  await deps.sms.send({
    to: phone,
    template: 'phone-otp',
    data: { code, minutes: String(OTP_TTL_MINUTES) },
  });
}
