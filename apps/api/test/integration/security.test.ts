import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startHarness, stopHarness, type Harness } from '../helpers/harness.js';
import { registerAndVerify, signIn } from '../helpers/actors.js';

let app: Express;
let harness: Harness;

beforeAll(async () => {
  harness = await startHarness();
  app = harness.app;
}, 120_000);

afterAll(async () => {
  await stopHarness();
});

/**
 * The properties that must hold however the code changes underneath them.
 *
 * These are not tests of a feature; they are the assumptions the whole system rests on, and
 * each one is here because breaking it would be quiet rather than loud.
 */
describe('the guarantees', () => {
  it('sends the security headers a browser needs to enforce anything', async () => {
    const response = await request(app).get('/healthz').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
    // Clickjacking: the app must not be framable.
    expect(response.headers['x-frame-options'] ?? response.headers['content-security-policy'])
      .toBeTruthy();
  });

  it('never returns a stack trace or an internal path to a client', async () => {
    const response = await request(app).get('/api/v1/properties/does-not-exist');

    const body = JSON.stringify(response.body);
    expect(body).not.toMatch(/\/home\/|node_modules|at Object|\.ts:\d+/);
    expect(response.body.error.code).toBeTruthy();
    expect(response.body.error.requestId).toBeTruthy();
  });

  it('refuses an operator smuggled through a query string', async () => {
    // `?district[$ne]=` is the classic. Mongoose's sanitizeFilter plus a strict schema
    // means it is refused rather than quietly matching everything.
    const response = await request(app).get('/api/v1/properties?district[$ne]=nothing');
    expect(response.status).toBe(400);
  });

  it('ignores a field the client invented rather than storing it', async () => {
    const identity = {
      fullName: 'Trying It On',
      email: 'trying@example.com',
      phone: '9876500123',
      password: 'a-long-enough-password',
      role: 'admin',
    };

    // Registration always creates a buyer; `role` is not something a client may send.
    const response = await request(app).post('/api/v1/auth/register').send(identity);
    expect(response.status).toBe(400);
  });

  it('keeps the session cookie out of JavaScript’s reach', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: account.email, password: account.password })
      .expect(200);

    const cookies = (response.headers['set-cookie'] as unknown as string[]) ?? [];
    const access = cookies.find((cookie) => cookie.startsWith('lx_at='));
    const refresh = cookies.find((cookie) => cookie.startsWith('lx_rt='));
    const csrf = cookies.find((cookie) => cookie.startsWith('lx_csrf='));

    expect(access).toContain('HttpOnly');
    expect(refresh).toContain('HttpOnly');
    expect(refresh).toContain('SameSite=Strict');
    // The CSRF token is the one cookie that must be readable — that is the whole mechanism.
    expect(csrf).not.toContain('HttpOnly');
  });

  it('refuses an unsafe request that carries no CSRF header', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const agent = request.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ identifier: account.email, password: account.password })
      .expect(200);

    // The cookies are attached, the header is not: exactly what a cross-site form does.
    await agent.post('/api/v1/auth/logout').expect(403);
  });

  it('never puts a password or its hash in a response', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const session = await signIn(app, {
      identifier: account.email,
      password: account.password,
    });

    const me = await session.agent.get('/api/v1/auth/me').expect(200);
    const body = JSON.stringify(me.body);

    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain(account.password);
    expect(body).not.toMatch(/\$2[aby]\$/);
  });

  it('answers the same way whether or not an account exists', async () => {
    const account = await registerAndVerify(app, harness.outbox);

    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: account.email, password: 'not-the-right-password' });
    const noSuchAccount = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'nobody@example.com', password: 'not-the-right-password' });

    expect(wrongPassword.status).toBe(noSuchAccount.status);
    expect(wrongPassword.body.error.message).toBe(noSuchAccount.body.error.message);
  });

  it('rejects a JWT somebody signed themselves', async () => {
    // Three base64 segments, structurally a token, signed with nothing we know.
    const forged = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(JSON.stringify({ sub: 'anyone', role: 'admin', ver: 0 })).toString('base64url'),
      'not-a-real-signature',
    ].join('.');

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `lx_at=${forged}`);

    expect(response.status).toBe(401);
  });

  it('will not accept an "alg: none" token either', async () => {
    const unsigned = [
      Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
      Buffer.from(JSON.stringify({ sub: 'anyone', role: 'admin', ver: 0 })).toString('base64url'),
      '',
    ].join('.');

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `lx_at=${unsigned}`);

    expect(response.status).toBe(401);
  });

  it('limits how often a password can be guessed', async () => {
    const account = await registerAndVerify(app, harness.outbox);

    // The suite raises this to 10,000 so the other tests are not throttled; this one is
    // about the limit itself, so it puts a realistic number back. The limiter reads the
    // value per request, which is exactly why it was made configuration rather than a
    // constant.
    const { resetEnvForTests } = await import('../../src/config/env.js');
    process.env.AUTH_RATE_LIMIT_MAX = '5';
    resetEnvForTests();

    let sawLimit = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: account.email, password: `guess-${attempt}` });

      if (response.status === 429) {
        sawLimit = true;
        break;
      }
    }

    process.env.AUTH_RATE_LIMIT_MAX = '10000';
    resetEnvForTests();

    expect(sawLimit, 'password guessing was never rate limited').toBe(true);
  });
});
