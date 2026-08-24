import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startHarness, stopHarness, resetDatabase, type Harness } from '../helpers/harness.js';
import { csrfFrom, nextIdentity, tokenFromUrl } from '../helpers/actors.js';

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

/**
 * The journey exactly as the browser makes it.
 *
 * The other suites use helpers that shortcut registration; this one does not, because the
 * sign-up modal now drives these calls in this order and a mismatch between what the form
 * sends and what the API expects is invisible to a test that uses the helper.
 */
describe('signing up, the way the form does it', () => {
  it('takes someone from the register modal to a working session', async () => {
    const identity = nextIdentity();

    // 1. The register modal posts the brief's fields and gets 202 — not a session.
    const registration = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: identity.fullName,
        email: identity.email,
        phone: identity.phone,
        password: identity.password,
        budgetBand: '25l-50l',
      })
      .expect(202);

    expect(registration.body.userId).toBeTruthy();
    expect(registration.headers['set-cookie']).toBeUndefined();

    // 2. Both channels are contacted, because both must be confirmed.
    const emailMessage = harness.outbox
      .outbox()
      .find((message) => message.template === 'verify-email' && message.to === identity.email);
    const smsMessage = harness.outbox
      .outbox()
      .find((message) => message.template === 'phone-otp' && message.to === identity.phone);

    expect(emailMessage, 'no confirmation email').toBeTruthy();
    expect(smsMessage, 'no phone code').toBeTruthy();

    // 3. Signing in before confirming is refused, and says which half is outstanding.
    const tooEarly = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: identity.email, password: identity.password })
      .expect(403);
    expect(tooEarly.body.error.code).toBe('EMAIL_NOT_VERIFIED');

    // 4. The link in the email — this is what /verify-email posts on mount.
    await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: tokenFromUrl(emailMessage?.data.url) })
      .expect(200);

    // Still not enough: the phone is the other half.
    const stillEarly = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: identity.email, password: identity.password })
      .expect(403);
    expect(stillEarly.body.error.code).toBe('PHONE_NOT_VERIFIED');

    // 5. The six-digit code the modal collects.
    await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: identity.phone, code: smsMessage?.data.code })
      .expect(200);

    // 6. Now the sign-in works, and the header has what it needs to render.
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: identity.email, password: identity.password })
      .expect(200);

    expect(login.body.user).toMatchObject({
      fullName: identity.fullName,
      role: 'buyer',
      emailVerified: true,
      phoneVerified: true,
    });
    expect(login.body.user).toHaveProperty('avatarUrl');
  });

  it('signs in with the mobile number just as well as the email', async () => {
    const identity = nextIdentity();
    await request(app).post('/api/v1/auth/register').send(identity).expect(202);

    const emailMessage = harness.outbox
      .outbox()
      .find((message) => message.template === 'verify-email' && message.to === identity.email);
    const smsMessage = harness.outbox
      .outbox()
      .find((message) => message.template === 'phone-otp' && message.to === identity.phone);

    await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: tokenFromUrl(emailMessage?.data.url) });
    await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: identity.phone, code: smsMessage?.data.code });

    await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: identity.phone, password: identity.password })
      .expect(200);
  });

  it('answers "who am I" with nobody rather than an error for a visitor', async () => {
    // The header asks this on every page load, signed in or not.
    const response = await request(app).get('/api/v1/auth/me');
    expect(response.status).toBe(401);
  });

  it('does not reveal whether an address has an account', async () => {
    const known = nextIdentity();
    await request(app).post('/api/v1/auth/register').send(known).expect(202);

    const forKnown = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: known.email })
      .expect(200);
    const forStranger = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody-at-all@example.com' })
      .expect(200);

    expect(forKnown.body).toEqual(forStranger.body);
  });

  it('signs the visitor out properly, not just in the browser', async () => {
    const identity = nextIdentity();
    await request(app).post('/api/v1/auth/register').send(identity).expect(202);

    const emailMessage = harness.outbox
      .outbox()
      .find((message) => message.template === 'verify-email' && message.to === identity.email);
    const smsMessage = harness.outbox
      .outbox()
      .find((message) => message.template === 'phone-otp' && message.to === identity.phone);
    await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: tokenFromUrl(emailMessage?.data.url) });
    await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: identity.phone, code: smsMessage?.data.code });

    const agent = request.agent(app);
    const login = await agent
      .post('/api/v1/auth/login')
      .send({ identifier: identity.email, password: identity.password })
      .expect(200);
    const csrf = csrfFrom(login.headers['set-cookie'] as unknown as string[]);

    await agent.get('/api/v1/auth/me').expect(200);
    await agent.post('/api/v1/auth/logout').set('x-csrf-token', csrf).expect(200);
    await agent.get('/api/v1/auth/me').expect(401);
  });
});
