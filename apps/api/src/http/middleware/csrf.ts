import { randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/AppError.js';
import { ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE } from '../cookies.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const CSRF_HEADER = 'x-csrf-token';

export const createCsrfToken = (): string => randomBytes(24).toString('base64url');

/**
 * Double-submit check on state-changing requests that carry a session.
 *
 * Session cookies are `SameSite=Lax`, which already blocks most cross-site posts. This is
 * the second lock: a cross-site page can cause the browser to send our cookie, but it
 * cannot read that cookie to copy its value into a header. Matching the two proves the
 * request came from our own app.
 *
 * Requests with no session cookie are left alone — register, sign in and forgot-password
 * are made by visitors who have never been issued a CSRF cookie, and there is no ambient
 * authority to abuse until one exists.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) return next();

  const hasSession = Boolean(req.cookies?.[ACCESS_COOKIE] ?? req.cookies?.[REFRESH_COOKIE]);
  if (!hasSession) return next();

  const cookie = req.cookies?.[CSRF_COOKIE];
  const header = req.get(CSRF_HEADER);

  if (!cookie || !header || cookie !== header) {
    return next(
      new AppError('FORBIDDEN', 'This request could not be verified. Reload the page and try again.'),
    );
  }
  return next();
}
