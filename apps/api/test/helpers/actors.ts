import request from 'supertest';
import type { Express } from 'express';
import type { LoggingNotifier } from '../../src/application/ports/notifications.js';

/**
 * Helpers that put a real signed-in user behind a supertest agent. Tests then read like the
 * flows they describe rather than like a sequence of HTTP calls.
 */

export interface Registered {
  email: string;
  phone: string;
  password: string;
  userId: string;
}

/**
 * Pulls the single-use token out of a link we just "sent". Accepts `undefined` because
 * `noUncheckedIndexedAccess` makes every template field optional at the type level — which
 * is right: a missing field should fail loudly here rather than produce "undefined" in a URL.
 */
export function tokenFromUrl(url: string | undefined): string {
  if (!url) throw new Error('the notification carried no url');
  const token = new URL(url).searchParams.get('token');
  if (!token) throw new Error(`no token in ${url}`);
  return token;
}

let counter = 0;

export function nextIdentity() {
  counter += 1;
  return {
    fullName: `Test Person ${counter}`,
    email: `person${counter}@example.com`,
    phone: `9${String(800000000 + counter).padStart(9, '0')}`,
    password: 'a-long-enough-password',
  };
}

/** Registers, then completes both verification channels using what the notifier captured. */
export async function registerAndVerify(
  app: Express,
  outbox: LoggingNotifier,
  overrides: Partial<ReturnType<typeof nextIdentity>> = {},
): Promise<Registered> {
  const identity = { ...nextIdentity(), ...overrides };

  const registration = await request(app).post('/api/v1/auth/register').send(identity);
  if (registration.status !== 202) {
    throw new Error(`registration failed: ${registration.status} ${registration.text}`);
  }

  const verifyMessage = outbox
    .outbox()
    .find((message) => message.template === 'verify-email' && message.to === identity.email);
  const otpMessage = outbox
    .outbox()
    .find((message) => message.template === 'phone-otp' && message.to === identity.phone);

  if (!verifyMessage || !otpMessage) throw new Error('verification messages were not issued');

  await request(app)
    .post('/api/v1/auth/verify-email')
    .send({ token: tokenFromUrl(verifyMessage.data.url) });
  await request(app)
    .post('/api/v1/auth/otp/verify')
    .send({ phone: identity.phone, code: otpMessage.data.code });

  return {
    email: identity.email,
    phone: identity.phone,
    password: identity.password,
    userId: registration.body.userId,
  };
}

/**
 * A supertest agent holding the session cookies, with the CSRF header attached to every
 * unsafe request — exactly what the browser client does.
 */
export async function signIn(app: Express, credentials: { identifier: string; password: string }) {
  const agent = request.agent(app);
  const response = await agent.post('/api/v1/auth/login').send(credentials);
  if (response.status !== 200) {
    throw new Error(`login failed: ${response.status} ${response.text}`);
  }

  const csrf = csrfFrom(response.headers['set-cookie'] as unknown as string[]);
  return {
    agent,
    csrf,
    user: response.body.user,
    /** Wraps a supertest request with the CSRF header. */
    post: (path: string) => agent.post(path).set('x-csrf-token', csrf),
    patch: (path: string) => agent.patch(path).set('x-csrf-token', csrf),
    del: (path: string) => agent.delete(path).set('x-csrf-token', csrf),
  };
}

export function csrfFrom(setCookie: string[] | undefined): string {
  const cookie = (setCookie ?? []).find((value) => value.startsWith('lx_csrf='));
  const value = cookie?.split(';')[0]?.split('=')[1];
  if (!value) throw new Error('no csrf cookie was set');
  return decodeURIComponent(value);
}

/**
 * The refresh token the agent is currently holding. supertest's cookie jar is not readable
 * directly, so this reads it back from the response to a refreshless call.
 */
export async function currentRefreshCookie(
  agent: ReturnType<typeof request.agent>,
  csrf: string,
): Promise<string> {
  const response = await agent.post('/api/v1/auth/refresh').set('x-csrf-token', csrf);
  const cookies = (response.headers['set-cookie'] as unknown as string[]) ?? [];
  const value = cookies
    .find((cookie) => cookie.startsWith('lx_rt='))
    ?.split(';')[0]
    ?.split('=')[1];
  if (!value) throw new Error('no refresh cookie in the response');
  return value;
}
