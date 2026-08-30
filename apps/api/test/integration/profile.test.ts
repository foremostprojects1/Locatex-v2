import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startHarness, stopHarness, resetDatabase, type Harness } from '../helpers/harness.js';
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

beforeEach(async () => {
  await resetDatabase();
});

async function signedIn() {
  const account = await registerAndVerify(app, harness.outbox);
  const session = await signIn(app, { identifier: account.email, password: account.password });
  return { ...session, account };
}

describe('editing your own account', () => {
  it('saves a name, a photograph and the buyer’s preferences', async () => {
    const me = await signedIn();

    const response = await me.agent
      .patch('/api/v1/me/profile')
      .set('x-csrf-token', me.csrf)
      .send({
        fullName: 'Rameshbhai Patel',
        avatarUrl: 'https://cdn.example.com/me.jpg',
        preferredDistrict: 'Morbi',
        budgetBand: '50l-1cr',
      })
      .expect(200);

    expect(response.body.user).toMatchObject({
      fullName: 'Rameshbhai Patel',
      avatarUrl: 'https://cdn.example.com/me.jpg',
      preferredDistrict: 'Morbi',
      budgetBand: '50l-1cr',
    });

    // And it is still there on the next visit, which is what the form reads back.
    const me2 = await me.agent.get('/api/v1/auth/me').expect(200);
    expect(me2.body.user.preferredDistrict).toBe('Morbi');
  });

  it('lets a preference be cleared rather than only changed', async () => {
    const me = await signedIn();

    await me.agent
      .patch('/api/v1/me/profile')
      .set('x-csrf-token', me.csrf)
      .send({ preferredDistrict: 'Morbi' })
      .expect(200);

    const cleared = await me.agent
      .patch('/api/v1/me/profile')
      .set('x-csrf-token', me.csrf)
      .send({ preferredDistrict: null, avatarUrl: null })
      .expect(200);

    expect(cleared.body.user.preferredDistrict).toBeNull();
    expect(cleared.body.user.avatarUrl).toBeNull();
  });

  it('refuses to move the account onto an unverified identity', async () => {
    const me = await signedIn();

    // Email and phone are login identifiers and both are verified. Changing one is a
    // re-verification flow, not a form field — the schema rejects them outright.
    await me.agent
      .patch('/api/v1/me/profile')
      .set('x-csrf-token', me.csrf)
      .send({ email: 'someone-elses@example.com' })
      .expect(400);

    await me.agent
      .patch('/api/v1/me/profile')
      .set('x-csrf-token', me.csrf)
      .send({ phone: '9999999999' })
      .expect(400);

    await me.agent
      .patch('/api/v1/me/profile')
      .set('x-csrf-token', me.csrf)
      .send({ role: 'admin' })
      .expect(400);

    const unchanged = await me.agent.get('/api/v1/auth/me').expect(200);
    expect(unchanged.body.user.email).toBe(me.account.email);
    expect(unchanged.body.user.role).toBe('buyer');
  });

  it('is closed to a visitor', async () => {
    await request(app).patch('/api/v1/me/profile').send({ fullName: 'Nobody' }).expect(401);
  });

  it('will not let a buyer edit a broker profile they do not have', async () => {
    const me = await signedIn();
    await me.agent
      .patch('/api/v1/me/broker-profile')
      .set('x-csrf-token', me.csrf)
      .send({ agencyName: 'Made Up Associates' })
      .expect(403);
  });
});
