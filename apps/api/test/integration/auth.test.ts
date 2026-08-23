import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startHarness, stopHarness, resetDatabase, type Harness } from '../helpers/harness.js';
import {
  currentRefreshCookie,
  nextIdentity,
  registerAndVerify,
  signIn,
  tokenFromUrl,
} from '../helpers/actors.js';

let app: Express;
let harness: Harness;

beforeAll(async () => {
  harness = await startHarness();
  app = harness.app;
}, 120_000);

afterAll(async () => {
  await stopHarness();
});

beforeEach(async () => {
  await resetDatabase();
});

describe('registration', () => {
  it('creates a buyer and issues both verification challenges', async () => {
    const identity = nextIdentity();
    const response = await request(app).post('/api/v1/auth/register').send(identity);

    expect(response.status).toBe(202);
    expect(response.body.userId).toBeTypeOf('string');

    const templates = harness.outbox.outbox().map((message) => message.template);
    expect(templates).toContain('verify-email');
    expect(templates).toContain('phone-otp');
  });

  it('never lets the caller choose a role', async () => {
    const identity = nextIdentity();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ ...identity, role: 'admin' })
      .expect(400); // strict schema: an unknown field is a rejected request, not a silent drop

    const { UserModel } = await import('../../src/infrastructure/db/models/User.js');
    expect(await UserModel.countDocuments()).toBe(0);
  });

  it('normalises an Indian mobile number however it is typed', async () => {
    const identity = nextIdentity();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ ...identity, phone: `+91 ${identity.phone.slice(0, 5)}-${identity.phone.slice(5)}` })
      .expect(202);

    const { UserModel } = await import('../../src/infrastructure/db/models/User.js');
    const stored = await UserModel.findOne({}).lean();
    expect(stored?.phone).toBe(identity.phone);
  });

  it('rejects a second account on the same email', async () => {
    const identity = nextIdentity();
    await request(app).post('/api/v1/auth/register').send(identity).expect(202);

    const second = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...nextIdentity(), email: identity.email });

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('CONFLICT');
    expect(second.body.error.details[0].field).toBe('email');
  });

  it('rejects a password that is too short', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...nextIdentity(), password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
  });
});

describe('verification gate', () => {
  it('refuses to sign in until both channels are confirmed', async () => {
    const identity = nextIdentity();
    await request(app).post('/api/v1/auth/register').send(identity).expect(202);

    const beforeAnything = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: identity.email, password: identity.password });
    expect(beforeAnything.status).toBe(403);
    expect(beforeAnything.body.error.code).toBe('EMAIL_NOT_VERIFIED');

    const link = harness.outbox.outbox().find((message) => message.template === 'verify-email');
    const token = tokenFromUrl(link!.data.url);
    await request(app).post('/api/v1/auth/verify-email').send({ token }).expect(200);

    const afterEmailOnly = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: identity.email, password: identity.password });
    expect(afterEmailOnly.status).toBe(403);
    expect(afterEmailOnly.body.error.code).toBe('PHONE_NOT_VERIFIED');

    const otp = harness.outbox.outbox().find((message) => message.template === 'phone-otp');
    await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: identity.phone, code: otp!.data.code })
      .expect(200);

    await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: identity.email, password: identity.password })
      .expect(200);
  });

  it('burns an OTP after five wrong guesses', async () => {
    const identity = nextIdentity();
    await request(app).post('/api/v1/auth/register').send(identity).expect(202);
    const otp = harness.outbox.outbox().find((message) => message.template === 'phone-otp');
    const wrong = otp!.data.code === '000000' ? '111111' : '000000';

    for (let attempt = 0; attempt < 5; attempt++) {
      await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone: identity.phone, code: wrong })
        .expect(422);
    }

    // Even the correct code no longer works — the budget is spent.
    const withCorrectCode = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: identity.phone, code: otp!.data.code });
    expect(withCorrectCode.status).toBe(422);
  });

  it('says nothing about whether an unknown number is registered', async () => {
    await request(app)
      .post('/api/v1/auth/otp/request')
      .send({ phone: '9999999999' })
      .expect(200, { sent: true });
  });
});

describe('sessions', () => {
  it('signs in with either the email or the mobile number', async () => {
    const account = await registerAndVerify(app, harness.outbox);

    await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: account.email, password: account.password })
      .expect(200);

    await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: account.phone, password: account.password })
      .expect(200);
  });

  it('sets httpOnly session cookies and a readable CSRF cookie', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: account.email, password: account.password });

    const cookies = response.headers['set-cookie'] as unknown as string[];
    const access = cookies.find((c) => c.startsWith('lx_at='))!;
    const refresh = cookies.find((c) => c.startsWith('lx_rt='))!;
    const csrf = cookies.find((c) => c.startsWith('lx_csrf='))!;

    expect(access).toContain('HttpOnly');
    expect(refresh).toContain('HttpOnly');
    expect(refresh).toContain('Path=/api/v1/auth'); // not sent with ordinary requests
    expect(refresh).toContain('SameSite=Strict');
    expect(csrf).not.toContain('HttpOnly'); // the app must be able to read this one
    expect(response.body.user.role).toBe('buyer');
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('gives the same answer for a wrong password and an unknown account', async () => {
    const account = await registerAndVerify(app, harness.outbox);

    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: account.email, password: 'not-the-right-password' });
    const unknownAccount = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'nobody@example.com', password: 'not-the-right-password' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownAccount.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownAccount.body.error.message);
  });

  it('rotates the refresh token, and revokes the family if an old one comes back', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const session = await signIn(app, { identifier: account.email, password: account.password });

    // Keep the first refresh token, as a thief who copied the cookie would.
    const stolen = await currentRefreshCookie(session.agent, session.csrf);

    // The legitimate client refreshes: the stolen token is now spent.
    const rotated = await session.agent
      .post('/api/v1/auth/refresh')
      .set('x-csrf-token', session.csrf);
    expect(rotated.status).toBe(200);

    // The thief replays the old token.
    const replay = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [`lx_rt=${stolen}`, `lx_csrf=${session.csrf}`])
      .set('x-csrf-token', session.csrf);

    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('SESSION_EXPIRED');

    // Reuse means one of the two copies is an attacker and we cannot tell which, so the
    // whole family dies — the honest user signs in again, the thief gains nothing.
    const afterReuse = await session.agent
      .post('/api/v1/auth/refresh')
      .set('x-csrf-token', session.csrf);
    expect(afterReuse.status).toBe(401);
  });

  it('ends the session on logout', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const session = await signIn(app, { identifier: account.email, password: account.password });

    await session.agent.get('/api/v1/auth/me').expect(200);
    await session.post('/api/v1/auth/logout').expect(200);
    await session.agent.get('/api/v1/auth/me').expect(401);
  });

  it('returns the signed-in user from /me and nothing sensitive', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const session = await signIn(app, { identifier: account.email, password: account.password });

    const response = await session.agent.get('/api/v1/auth/me').expect(200);
    expect(response.body.user.email).toBe(account.email);
    expect(response.body.user.emailVerified).toBe(true);
    expect(response.body.user.phoneVerified).toBe(true);
    expect(JSON.stringify(response.body)).not.toContain('$2');  // no bcrypt hash anywhere
  });
});

describe('CSRF', () => {
  it('rejects an unsafe request without the header', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const session = await signIn(app, { identifier: account.email, password: account.password });

    const withoutHeader = await session.agent.post('/api/v1/auth/logout-everywhere');
    expect(withoutHeader.status).toBe(403);

    const withHeader = await session.post('/api/v1/auth/logout-everywhere');
    expect(withHeader.status).toBe(200);
  });

  it('rejects a header that does not match the cookie', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const session = await signIn(app, { identifier: account.email, password: account.password });

    await session.agent
      .post('/api/v1/auth/logout-everywhere')
      .set('x-csrf-token', 'a-different-value')
      .expect(403);
  });

  it('leaves safe requests alone', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const session = await signIn(app, { identifier: account.email, password: account.password });
    await session.agent.get('/api/v1/auth/me').expect(200);
  });
});

describe('passwords', () => {
  it('changes the password and signs every device out', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const first = await signIn(app, { identifier: account.email, password: account.password });
    const second = await signIn(app, { identifier: account.email, password: account.password });

    await first
      .patch('/api/v1/auth/password')
      .send({ currentPassword: account.password, newPassword: 'a-brand-new-password' })
      .expect(200);

    // The other device's access token is invalidated by the token-version bump.
    await second.agent.get('/api/v1/auth/me').expect(401);

    await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: account.email, password: 'a-brand-new-password' })
      .expect(200);
  });

  it('refuses a change without the correct current password', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const session = await signIn(app, { identifier: account.email, password: account.password });

    const response = await session
      .patch('/api/v1/auth/password')
      .send({ currentPassword: 'wrong', newPassword: 'a-brand-new-password' });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('currentPassword');
  });

  it('resets a forgotten password through the emailed link', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    await request(app).post('/api/v1/auth/forgot-password').send({ email: account.email }).expect(200);

    const mail = harness.outbox.outbox().find((message) => message.template === 'reset-password');
    const token = tokenFromUrl(mail!.data.url);

    await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'password-after-reset' })
      .expect(200);

    await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: account.email, password: 'password-after-reset' })
      .expect(200);

    // A reset link is single use.
    await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'another-password-again' })
      .expect(400);
  });

  it('answers a forgotten-password request for an unknown address identically', async () => {
    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(response.status).toBe(200);
    expect(harness.outbox.outbox().some((m) => m.template === 'reset-password')).toBe(false);
  });
});
