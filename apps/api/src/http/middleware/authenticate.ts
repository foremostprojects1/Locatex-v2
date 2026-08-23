import type { NextFunction, Request, Response } from 'express';
import type { Principal, Role } from '@locatex/contracts';
import { verifyAccessToken } from '../../infrastructure/auth/tokens.js';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { AppError } from '../../shared/AppError.js';
import { ACCESS_COOKIE } from '../cookies.js';

/**
 * The principal is kept beside the request rather than assigned onto it. Augmenting
 * Express's Request type collides with pino-http's own augmentation (the same reason
 * `requestIdOf` exists), and a WeakMap keeps the typing honest with no global side effects.
 */
const principals = new WeakMap<Request, Principal>();

/**
 * Reads the session cookie if there is one. Never rejects: a request without a session is
 * a guest, which most public endpoints are happy to serve. Enforcement is `requireRole`.
 *
 * The token's version is checked against the account, so a password change or a suspension
 * takes effect on the next request rather than when the token happens to expire.
 */
export async function attachPrincipal(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) {
    principals.set(req, { kind: 'guest' });
    return next();
  }

  try {
    const claims = await verifyAccessToken(token);
    const user = await UserModel.findOne({ _id: claims.sub, deletedAt: null })
      .select('role status tokenVersion')
      .lean();

    if (!user || user.status !== 'active' || user.tokenVersion !== claims.ver) {
      principals.set(req, { kind: 'guest' });
      return next();
    }

    principals.set(req, { kind: 'user', id: String(user._id), role: user.role as Role });
  } catch {
    // Expired or tampered: treat as a guest. The client refreshes and retries.
    principals.set(req, { kind: 'guest' });
  }
  return next();
}

export function principalOf(req: Request): Principal {
  return principals.get(req) ?? { kind: 'guest' };
}

/** Narrows to a signed-in principal, or throws — saves repeating the guard in every route. */
export function userOf(req: Request): { id: string; role: Role } {
  const principal = principalOf(req);
  if (principal.kind !== 'user') throw AppError.unauthenticated();
  return { id: principal.id, role: principal.role };
}

/** Requires a signed-in user, and optionally one of a set of roles. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const principal = principalOf(req);
    if (principal.kind !== 'user') {
      return next(AppError.unauthenticated());
    }
    if (roles.length > 0 && !roles.includes(principal.role)) {
      return next(
        AppError.forbidden(
          principal.role === 'buyer' && roles.includes('broker')
            ? 'Only registered brokers can do this. Apply from your dashboard.'
            : 'You do not have access to this.',
        ),
      );
    }
    return next();
  };
}

/** Requires a session of any role. */
export const requireUser = requireRole();
