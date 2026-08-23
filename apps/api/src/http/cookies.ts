import type { CookieOptions, Response } from 'express';
import { env } from '../config/env.js';

/**
 * Session cookies. The tokens live here rather than in localStorage because they unlock
 * broker contact details — the product's paywall — and anything JavaScript can read,
 * injected JavaScript can steal.
 */
export const ACCESS_COOKIE = 'lx_at';
export const REFRESH_COOKIE = 'lx_rt';
export const CSRF_COOKIE = 'lx_csrf';

const base = (): CookieOptions => ({
  httpOnly: true,
  secure: env().NODE_ENV === 'production',
  sameSite: 'lax',
  domain: env().COOKIE_DOMAIN,
  path: '/',
});

export function setSessionCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string; csrfToken: string },
): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...base(), maxAge: 15 * 60_000 });

  // The refresh cookie is scoped to the endpoints that use it, so it is not sent with every
  // request — and is strict, because no legitimate flow refreshes a session cross-site.
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base(),
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: env().REFRESH_TTL_DAYS * 86_400_000,
  });

  // Readable on purpose: the app copies it into a header, which is the half of the
  // double-submit check that a cross-site page cannot forge.
  res.cookie(CSRF_COOKIE, tokens.csrfToken, {
    ...base(),
    httpOnly: false,
    maxAge: env().REFRESH_TTL_DAYS * 86_400_000,
  });
}

export function clearSessionCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...base() });
  res.clearCookie(REFRESH_COOKIE, { ...base(), sameSite: 'strict', path: '/api/v1/auth' });
  res.clearCookie(CSRF_COOKIE, { ...base(), httpOnly: false });
}
