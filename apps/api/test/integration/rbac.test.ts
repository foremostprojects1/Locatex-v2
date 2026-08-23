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

/** Promotes an account directly, standing in for admin bootstrap. */
async function makeAdmin(userId: string): Promise<void> {
  const { UserModel } = await import('../../src/infrastructure/db/models/User.js');
  await UserModel.updateOne({ _id: userId }, { $set: { role: 'admin' } });
}

describe('the broker upgrade path', () => {
  it('takes a buyer from application to approved broker', async () => {
    const applicant = await registerAndVerify(app, harness.outbox);
    const adminAccount = await registerAndVerify(app, harness.outbox);
    await makeAdmin(adminAccount.userId);

    const buyer = await signIn(app, { identifier: applicant.email, password: applicant.password });
    expect(buyer.user.role).toBe('buyer');
    expect(buyer.user.brokerApplicationStatus).toBe('none');

    await buyer
      .post('/api/v1/auth/broker-application')
      .send({
        agencyName: 'Patel Land Associates',
        officeAddress: 'Shop 4, Sanala Road, Morbi, Gujarat 363641',
        district: 'Morbi',
        reraNumber: 'GJ/RERA/1234',
        experienceYears: 6,
      })
      .expect(202);

    const pendingView = await buyer.agent.get('/api/v1/auth/me').expect(200);
    expect(pendingView.body.user.brokerApplicationStatus).toBe('pending');
    expect(pendingView.body.user.role).toBe('buyer'); // applying grants nothing by itself

    const admin = await signIn(app, {
      identifier: adminAccount.email,
      password: adminAccount.password,
    });
    const queue = await admin.agent.get('/api/v1/auth/broker-applications').expect(200);
    expect(queue.body.data).toHaveLength(1);
    expect(queue.body.data[0].brokerApplication.agencyName).toBe('Patel Land Associates');

    await admin
      .post(`/api/v1/auth/broker-applications/${applicant.userId}`)
      .send({ decision: 'approve' })
      .expect(200);

    // Approval ends the applicant's sessions on purpose: the next sign-in mints a token
    // carrying the new role, so nobody is left holding a stale buyer token.
    await buyer.agent.get('/api/v1/auth/me').expect(401);

    const asBroker = await signIn(app, {
      identifier: applicant.email,
      password: applicant.password,
    });
    expect(asBroker.user.role).toBe('broker');
    expect(asBroker.user.brokerApplicationStatus).toBe('approved');

    const mail = harness.outbox.outbox().find((m) => m.template === 'broker-approved');
    expect(mail?.to).toBe(applicant.email);
  });

  it('rejects with a reason and lets the applicant re-apply', async () => {
    const applicant = await registerAndVerify(app, harness.outbox);
    const adminAccount = await registerAndVerify(app, harness.outbox);
    await makeAdmin(adminAccount.userId);

    const buyer = await signIn(app, { identifier: applicant.email, password: applicant.password });
    const application = {
      agencyName: 'Unverified Traders',
      officeAddress: 'Somewhere in Rajkot, Gujarat 360001',
      district: 'Rajkot',
    };
    await buyer.post('/api/v1/auth/broker-application').send(application).expect(202);

    const admin = await signIn(app, {
      identifier: adminAccount.email,
      password: adminAccount.password,
    });

    // A rejection without a reason is refused — the applicant has to know what to fix.
    await admin
      .post(`/api/v1/auth/broker-applications/${applicant.userId}`)
      .send({ decision: 'reject' })
      .expect(400);

    await admin
      .post(`/api/v1/auth/broker-applications/${applicant.userId}`)
      .send({ decision: 'reject', reason: 'Office address could not be verified.' })
      .expect(200);

    const mail = harness.outbox.outbox().find((m) => m.template === 'broker-rejected');
    expect(mail?.data.reason).toBe('Office address could not be verified.');

    // Still a buyer, still signed in, and free to apply again.
    const afterRejection = await buyer.agent.get('/api/v1/auth/me').expect(200);
    expect(afterRejection.body.user.role).toBe('buyer');
    expect(afterRejection.body.user.brokerApplicationStatus).toBe('rejected');

    await buyer.post('/api/v1/auth/broker-application').send(application).expect(202);
  });

  it('refuses a second application while one is pending', async () => {
    const applicant = await registerAndVerify(app, harness.outbox);
    const buyer = await signIn(app, { identifier: applicant.email, password: applicant.password });
    const application = {
      agencyName: 'Land Co',
      officeAddress: 'Main Road, Wankaner, Gujarat 363621',
      district: 'Morbi',
    };

    await buyer.post('/api/v1/auth/broker-application').send(application).expect(202);
    const second = await buyer.post('/api/v1/auth/broker-application').send(application);
    expect(second.status).toBe(409);
  });
});

describe('the permission matrix', () => {
  it('keeps the admin queue away from guests and buyers', async () => {
    await request(app).get('/api/v1/auth/broker-applications').expect(401);

    const account = await registerAndVerify(app, harness.outbox);
    const buyer = await signIn(app, { identifier: account.email, password: account.password });

    const asBuyer = await buyer.agent.get('/api/v1/auth/broker-applications');
    expect(asBuyer.status).toBe(403);
    expect(asBuyer.body.error.code).toBe('FORBIDDEN');
  });

  it('stops a buyer from deciding their own application', async () => {
    const applicant = await registerAndVerify(app, harness.outbox);
    const buyer = await signIn(app, { identifier: applicant.email, password: applicant.password });

    await buyer
      .post('/api/v1/auth/broker-application')
      .send({
        agencyName: 'Self Approving Ltd',
        officeAddress: 'Anywhere at all, Gujarat 360001',
        district: 'Rajkot',
      })
      .expect(202);

    const attempt = await buyer
      .post(`/api/v1/auth/broker-applications/${applicant.userId}`)
      .send({ decision: 'approve' });

    expect(attempt.status).toBe(403);

    const stillBuyer = await buyer.agent.get('/api/v1/auth/me');
    expect(stillBuyer.body.user.role).toBe('buyer');
  });

  it('treats a request with no session as a guest rather than an error', async () => {
    await request(app).get('/api/v1/auth/me').expect(401);
    await request(app).get('/healthz').expect(200);
  });

  it('drops a session the moment the account is suspended', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const session = await signIn(app, { identifier: account.email, password: account.password });
    await session.agent.get('/api/v1/auth/me').expect(200);

    const { UserModel } = await import('../../src/infrastructure/db/models/User.js');
    await UserModel.updateOne({ _id: account.userId }, { $set: { status: 'suspended' } });

    // The access token is still cryptographically valid; the status check is what stops it.
    await session.agent.get('/api/v1/auth/me').expect(401);

    const signInAgain = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: account.email, password: account.password });
    expect(signInAgain.status).toBe(403);
  });

  it('invalidates outstanding tokens when the token version moves', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const session = await signIn(app, { identifier: account.email, password: account.password });
    await session.agent.get('/api/v1/auth/me').expect(200);

    const { UserModel } = await import('../../src/infrastructure/db/models/User.js');
    await UserModel.updateOne({ _id: account.userId }, { $inc: { tokenVersion: 1 } });

    await session.agent.get('/api/v1/auth/me').expect(401);
  });
});
