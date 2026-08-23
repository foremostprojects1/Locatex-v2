import { Router, type Request, type Router as ExpressRouter } from 'express';
import rateLimit from 'express-rate-limit';
import {
  brokerApplicationSchema,
  brokerDecisionSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  requestOtpSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyOtpSchema,
} from '@locatex/contracts';
import { env } from '../../config/env.js';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { AppError } from '../../shared/AppError.js';
import { registerUser } from '../../application/auth/registerUser.js';
import { resendPhoneOtp, verifyEmail, verifyPhoneOtp } from '../../application/auth/verifyContact.js';
import {
  login,
  logout,
  logoutEverywhere,
  refreshSession,
  toSessionUser,
  type SessionContext,
} from '../../application/auth/session.js';
import {
  changePassword,
  requestPasswordReset,
  resetPassword,
} from '../../application/auth/passwords.js';
import {
  applyToBecomeBroker,
  decideBrokerApplication,
} from '../../application/auth/brokerApplication.js';
import { clearSessionCookies, CSRF_COOKIE, REFRESH_COOKIE, setSessionCookies } from '../cookies.js';
import { createCsrfToken } from '../middleware/csrf.js';
import { requireRole, requireUser, userOf } from '../middleware/authenticate.js';
import { z } from 'zod';
import { notifier } from '../../container.js';

/**
 * Credential endpoints are rate limited per IP. The limits are generous enough that a
 * person retyping a password never meets them, and tight enough that guessing at scale is
 * not worth attempting.
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60_000,
  // Read per request rather than captured at import time, so the limit is configuration
  // rather than a constant baked into the module.
  limit: () => env().AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(new AppError('RATE_LIMITED', 'Too many attempts. Try again in a few minutes.', { retryAfterSeconds: 900 })),
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: () => env().OTP_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(new AppError('RATE_LIMITED', 'Too many codes requested. Try again later.', { retryAfterSeconds: 3600 })),
});

const contextOf = (req: Request): SessionContext => ({
  userAgent: req.get('user-agent') ?? undefined,
  ip: req.ip,
  refreshTtlDays: env().REFRESH_TTL_DAYS,
});

const deps = () => ({
  email: notifier(),
  sms: notifier(),
  appBaseUrl: env().APP_BASE_URL,
});

// Annotated because the inferred type reaches into a pnpm-hashed path, which tsc
// refuses to name in the emitted declarations.
export const authRouter: ExpressRouter = Router();

authRouter.post('/register', strictLimiter, async (req, res, next) => {
  try {
    const result = await registerUser(registerSchema.parse(req.body), deps());
    // 202: the account exists but cannot be used until both channels are confirmed.
    res.status(202).json({
      userId: result.userId,
      message: 'Check your email for the verification link, and your phone for the code.',
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/verify-email', strictLimiter, async (req, res, next) => {
  try {
    await verifyEmail(verifyEmailSchema.parse(req.body).token);
    res.json({ verified: true });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/otp/request', otpLimiter, async (req, res, next) => {
  try {
    await resendPhoneOtp(requestOtpSchema.parse(req.body).phone, deps());
    // Always the same answer, so this cannot be used to test which numbers are registered.
    res.json({ sent: true });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/otp/verify', strictLimiter, async (req, res, next) => {
  try {
    const { phone, code } = verifyOtpSchema.parse(req.body);
    await verifyPhoneOtp(phone, code);
    res.json({ verified: true });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', strictLimiter, async (req, res, next) => {
  try {
    const session = await login(loginSchema.parse(req.body), contextOf(req));
    setSessionCookies(res, { ...session, csrfToken: createCsrfToken() });
    res.json({ user: session.user });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const presented = req.cookies?.[REFRESH_COOKIE];
    if (!presented) throw new AppError('SESSION_EXPIRED', 'Your session has ended. Please sign in.');

    const session = await refreshSession(presented, contextOf(req));
    // The CSRF token deliberately survives a refresh. Rotating it would invalidate the
    // header on any request the client already had in flight, and the double-submit check
    // depends on the value being unguessable, not on it being new.
    const csrfToken = req.cookies?.[CSRF_COOKIE] ?? createCsrfToken();
    setSessionCookies(res, { ...session, csrfToken });
    res.json({ user: session.user });
  } catch (error) {
    clearSessionCookies(res);
    next(error);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    await logout(req.cookies?.[REFRESH_COOKIE]);
    clearSessionCookies(res);
    res.json({ signedOut: true });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout-everywhere', requireUser, async (req, res, next) => {
  try {
    await logoutEverywhere(userOf(req).id, 'user-requested');
    clearSessionCookies(res);
    res.json({ signedOut: true });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireUser, async (req, res, next) => {
  try {
    const user = await UserModel.findOne({ _id: userOf(req).id, deletedAt: null });
    if (!user) throw AppError.unauthenticated();
    res.json({ user: toSessionUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.patch('/password', requireUser, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await changePassword(userOf(req).id, currentPassword, newPassword, notifier());
    clearSessionCookies(res);
    res.json({ changed: true, message: 'Password changed. Sign in again on your devices.' });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/forgot-password', strictLimiter, async (req, res, next) => {
  try {
    await requestPasswordReset(forgotPasswordSchema.parse(req.body).email, deps());
    res.json({ sent: true, message: 'If that address has an account, a reset link is on its way.' });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/reset-password', strictLimiter, async (req, res, next) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    await resetPassword(token, newPassword);
    res.json({ reset: true });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/broker-application', requireUser, async (req, res, next) => {
  try {
    await applyToBecomeBroker(userOf(req).id, brokerApplicationSchema.parse(req.body));
    res.status(202).json({ submitted: true, message: 'Your application is with our team.' });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/broker-applications', requireRole('admin'), async (_req, res, next) => {
  try {
    const pending = await UserModel.find({ 'brokerApplication.status': 'pending', deletedAt: null })
      .select('fullName email phone brokerApplication createdAt')
      .sort({ 'brokerApplication.submittedAt': 1 })
      .lean();
    res.json({ data: pending });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/broker-applications/:userId', requireRole('admin'), async (req, res, next) => {
  try {
    const admin = userOf(req);
    const { userId } = z.object({ userId: z.string().min(1) }).parse(req.params);
    const { decision, reason } = brokerDecisionSchema.parse(req.body);
    if (decision === 'reject' && !reason) {
      throw AppError.validation([
        { field: 'reason', code: 'REQUIRED', message: 'Tell the applicant why, so they can fix it.' },
      ]);
    }
    await decideBrokerApplication(admin.id, userId, decision, reason, notifier());
    res.json({ decided: decision });
  } catch (error) {
    next(error);
  }
});
