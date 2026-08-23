import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { OTP_LENGTH } from '@locatex/contracts';
import { env } from '../../config/env.js';
import type { Role } from '@locatex/contracts';

/** Claims carried by the access token. Small on purpose — anything else is looked up. */
export interface AccessClaims extends JWTPayload {
  sub: string;
  role: Role;
  ver: number;
}

const secret = (): Uint8Array => new TextEncoder().encode(env().JWT_SECRET);

export async function signAccessToken(claims: {
  userId: string;
  role: Role;
  tokenVersion: number;
}): Promise<string> {
  return new SignJWT({ role: claims.role, ver: claims.tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setIssuer('locatex')
    .setAudience('locatex-web')
    .setExpirationTime(env().JWT_ACCESS_TTL)
    .sign(secret());
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, secret(), {
    issuer: 'locatex',
    audience: 'locatex-web',
  });
  return payload as AccessClaims;
}

/**
 * Refresh tokens are opaque random strings, not JWTs: they must be revocable, and the only
 * way to revoke a self-contained token is to keep a list — at which point it may as well be
 * a database row. Only the hash is stored, so a database leak cannot be replayed as a session.
 */
export const createRefreshToken = (): string => randomBytes(32).toString('base64url');

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/** Single-use links (email verification, password reset) follow the same rule. */
export const createUrlToken = (): string => randomBytes(32).toString('base64url');

/** Six digits, from a CSPRNG rather than Math.random. */
export const createOtp = (): string =>
  String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');

/** Constant-time compare, so a wrong OTP cannot be found one digit at a time. */
export function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
