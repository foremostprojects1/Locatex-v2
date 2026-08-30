import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
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

async function actor(role: 'buyer' | 'broker' | 'admin') {
  const account = await registerAndVerify(app, harness.outbox);
  if (role !== 'buyer') {
    const { UserModel } = await import('../../src/infrastructure/db/models/User.js');
    await UserModel.updateOne({ _id: account.userId }, { $set: { role } });
  }
  const session = await signIn(app, { identifier: account.email, password: account.password });
  return { ...session, account };
}

const withCloudinary = async (run: () => Promise<void>) => {
  const { resetEnvForTests } = await import('../../src/config/env.js');
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = '123456789';
  process.env.CLOUDINARY_API_SECRET = 'a-test-secret';
  resetEnvForTests();
  try {
    await run();
  } finally {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    resetEnvForTests();
  }
};

describe('signing an image upload', () => {
  it('gives a broker what the browser needs, and nothing more', async () => {
    await withCloudinary(async () => {
      const broker = await actor('broker');
      const response = await broker
        .post('/api/v1/documents/images/signature')
        .send({ propertyId: 'PROP123' })
        .expect(200);

      const signature = response.body.data;
      expect(signature.cloudName).toBe('test-cloud');
      expect(signature.apiKey).toBe('123456789');
      expect(signature.folder).toBe('locatex/properties/PROP123');
      expect(signature.uploadUrl).toContain('api.cloudinary.com');

      // The secret signs the request; it must never travel to the browser.
      expect(JSON.stringify(response.body)).not.toContain('a-test-secret');
    });
  });

  it('produces the signature Cloudinary itself would compute', async () => {
    await withCloudinary(async () => {
      const broker = await actor('broker');
      const response = await broker
        .post('/api/v1/documents/images/signature')
        .send({})
        .expect(200);

      const { timestamp, folder, signature } = response.body.data;

      // Cloudinary hashes the parameters sorted by key, joined k=v with &, with the secret
      // appended — not used as a separate HMAC key. Recomputing it here is what proves we
      // got that detail right, because a wrong signature is simply refused with no reason.
      const expected = createHash('sha1')
        .update(`folder=${folder}&timestamp=${timestamp}` + 'a-test-secret')
        .digest('hex');

      expect(signature).toBe(expected);
    });
  });

  it('says plainly when image hosting is not configured', async () => {
    const broker = await actor('broker');
    const response = await broker
      .post('/api/v1/documents/images/signature')
      .send({})
      .expect(503);

    expect(response.body.error.code).toBe('STORAGE_UNAVAILABLE');
    expect(response.body.error.message).toContain('Paste a link');
  });

  it('is closed to buyers and visitors', async () => {
    await withCloudinary(async () => {
      const buyer = await actor('buyer');
      await buyer.post('/api/v1/documents/images/signature').send({}).expect(403);
      await request(app).post('/api/v1/documents/images/signature').send({}).expect(401);
    });
  });
});

describe('connecting Google Drive', () => {
  it('refuses to start when no Google client is configured', async () => {
    const admin = await actor('admin');
    const response = await admin.post('/api/v1/admin/storage/connect').send({}).expect(503);
    expect(response.body.error.code).toBe('STORAGE_UNAVAILABLE');
  });

  it('sends the administrator to Google asking only for the narrow scope', async () => {
    const { resetEnvForTests } = await import('../../src/config/env.js');
    process.env.GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
    resetEnvForTests();

    try {
      const admin = await actor('admin');
      const response = await admin.post('/api/v1/admin/storage/connect').send({}).expect(200);

      const url = new URL(response.body.url);
      expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');

      // drive.file only touches files this app created — it cannot read the rest of
      // somebody's personal Drive, and it avoids Google's verification review.
      expect(url.searchParams.get('scope')).toContain('drive.file');
      expect(url.searchParams.get('scope')).not.toContain('auth/drive ');

      // Both are needed or Google returns no refresh token and the connection cannot renew.
      expect(url.searchParams.get('access_type')).toBe('offline');
      expect(url.searchParams.get('prompt')).toBe('consent');

      // The state names who started this, so a crafted callback cannot attach a stranger's
      // Drive to the site.
      expect(url.searchParams.get('state')).toBeTruthy();
    } finally {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      resetEnvForTests();
    }
  });

  it('turns a cancelled or forged callback into a message, not an error page', async () => {
    // Google redirects a browser here, so failures have to land on the dashboard.
    const cancelled = await request(app)
      .get('/api/v1/storage/callback?error=access_denied')
      .expect(302);
    expect(cancelled.headers.location).toContain('storage=cancelled');

    const forged = await request(app)
      .get('/api/v1/storage/callback?code=whatever&state=not-a-real-token')
      .expect(302);
    expect(forged.headers.location).toContain('storage=failed');
  });

  it('lets only an administrator connect or disconnect', async () => {
    const broker = await actor('broker');
    await broker.post('/api/v1/admin/storage/connect').send({}).expect(403);
    await broker.post('/api/v1/admin/storage/disconnect').send({}).expect(403);
  });
});
