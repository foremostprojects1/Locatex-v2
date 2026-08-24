import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startHarness, stopHarness, resetDatabase, type Harness } from '../helpers/harness.js';
import { registerAndVerify, signIn } from '../helpers/actors.js';

let app: Express;
let harness: Harness;

const stubGeocoder = {
  lookupPincode: vi.fn(async () => ({
    lat: 22.8117,
    lng: 70.8319,
    radiusMetres: 9_400,
    source: 'nominatim' as const,
  })),
};

beforeAll(async () => {
  harness = await startHarness();
  app = harness.app;

  const { setGeocoder } = await import('../../src/container.js');
  setGeocoder(stubGeocoder);

  const indiaPost = await import('../../src/infrastructure/geo/indiaPost.js');
  vi.spyOn(indiaPost, 'lookupPostalPincode').mockResolvedValue(null);

  const { seedReferenceData } = await import('../../scripts/seed-reference.js');
  await seedReferenceData();
}, 180_000);

afterAll(async () => {
  const { setGeocoder } = await import('../../src/container.js');
  setGeocoder(undefined);
  await stopHarness();
});

beforeEach(async () => {
  await resetDatabase({ keepReference: true });
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

const listing = (overrides: Record<string, unknown> = {}) => ({
  title: 'Fertile farmland with borewell near Morbi',
  propertyType: 'land',
  listingType: 'sale',
  pricePaise: 72_00_000_00,
  area: { value: 4, unit: 'vigha' },
  location: {
    district: 'morbi',
    taluka: 'morbi',
    pincode: '363641',
    precision: 'approx',
    source: 'pincode',
  },
  contact: { name: 'Ramesh Patel', email: 'ramesh@example.com', phone: '9876543210' },
  ...overrides,
});

describe('the review queue', () => {
  it('shows what is waiting, and nothing else, in full detail', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');

    const waiting = await broker.post('/api/v1/properties').send(listing()).expect(201);
    await broker
      .post(`/api/v1/properties/${waiting.body.data.id}/status`)
      .send({ action: 'submit' })
      .expect(200);

    // A second listing left as a draft must not appear in anyone's queue.
    await broker.post('/api/v1/properties').send(listing({ title: 'A draft nobody submitted' }));

    const queue = await admin.agent.get('/api/v1/admin/properties').expect(200);
    expect(queue.body.total).toBe(1);
    expect(queue.body.data[0].title).toBe(listing().title);

    // The reviewer needs everything a decision depends on, redacted for nobody.
    expect(queue.body.data[0].contact.phone).toBe('9876543210');
    expect(queue.body.data[0].pricePaise).toBe(72_00_000_00);
  });

  it('is closed to brokers and buyers', async () => {
    const broker = await actor('broker');
    const buyer = await actor('buyer');

    await broker.agent.get('/api/v1/admin/properties').expect(403);
    await buyer.agent.get('/api/v1/admin/stats').expect(403);
    await request(app).get('/api/v1/admin/users').expect(401);
  });
});

describe('the dashboard numbers', () => {
  it('counts listings by status, users by role, and what is waiting', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    await actor('buyer');

    const first = await broker.post('/api/v1/properties').send(listing()).expect(201);
    await broker
      .post(`/api/v1/properties/${first.body.data.id}/status`)
      .send({ action: 'submit' })
      .expect(200);
    await broker.post('/api/v1/properties').send(listing({ title: 'Still being written up' }));

    const stats = await admin.agent.get('/api/v1/admin/stats').expect(200);

    expect(stats.body.data.listings.pending).toBe(1);
    expect(stats.body.data.listings.draft).toBe(1);
    expect(stats.body.data.pendingApprovals).toBe(1);
    expect(stats.body.data.users).toMatchObject({ buyer: 1, broker: 1, admin: 1 });
    // A status nobody has reached yet is an honest zero, not a missing key.
    expect(stats.body.data.listings.sold).toBe(0);
  });
});

describe('managing accounts', () => {
  it('lists people and finds one by name or email', async () => {
    const admin = await actor('admin');
    const broker = await actor('broker');

    const all = await admin.agent.get('/api/v1/admin/users').expect(200);
    expect(all.body.data.length).toBeGreaterThanOrEqual(2);

    const found = await admin.agent
      .get(`/api/v1/admin/users?q=${encodeURIComponent(broker.account.email)}`)
      .expect(200);
    expect(found.body.data).toHaveLength(1);
    expect(found.body.data[0].role).toBe('broker');
  });

  it('ends a suspended person’s sessions there and then', async () => {
    const admin = await actor('admin');
    const broker = await actor('broker');

    await broker.agent.get('/api/v1/auth/me').expect(200);

    await admin.agent
      .patch(`/api/v1/admin/users/${broker.account.userId}/status`)
      .set('x-csrf-token', admin.csrf)
      .send({ status: 'suspended' })
      .expect(200);

    // Not "when their token expires" — now.
    await broker.agent.get('/api/v1/auth/me').expect(401);
    await signIn(app, {
      identifier: broker.account.email,
      password: broker.account.password,
    }).catch((error: Error) => expect(error.message).toContain('login failed'));

    await admin.agent
      .patch(`/api/v1/admin/users/${broker.account.userId}/status`)
      .set('x-csrf-token', admin.csrf)
      .send({ status: 'active' })
      .expect(200);

    const restored = await signIn(app, {
      identifier: broker.account.email,
      password: broker.account.password,
    });
    expect(restored.user.role).toBe('broker');
  });

  it('refuses to suspend the last administrator, or oneself', async () => {
    const admin = await actor('admin');

    const self = await admin.agent
      .patch(`/api/v1/admin/users/${admin.account.userId}/status`)
      .set('x-csrf-token', admin.csrf)
      .send({ status: 'suspended' })
      .expect(409);
    expect(self.body.error.message).toContain('your own account');

    const second = await actor('admin');
    await admin.agent
      .patch(`/api/v1/admin/users/${second.account.userId}/status`)
      .set('x-csrf-token', admin.csrf)
      .send({ status: 'suspended' })
      .expect(200);

    // Now only one active admin is left, and nobody may remove them.
    const lastOne = await admin.agent
      .patch(`/api/v1/admin/users/${admin.account.userId}/status`)
      .set('x-csrf-token', admin.csrf)
      .send({ status: 'suspended' })
      .expect(409);
    expect(lastOne.body.error.code).toBe('CONFLICT');
  });

  it('records who did it', async () => {
    const admin = await actor('admin');
    const broker = await actor('broker');

    await admin.agent
      .patch(`/api/v1/admin/users/${broker.account.userId}/status`)
      .set('x-csrf-token', admin.csrf)
      .send({ status: 'suspended' })
      .expect(200);

    const { AuditEventModel } = await import('../../src/infrastructure/db/models/AuditEvent.js');
    const events = await AuditEventModel.find({ subjectId: broker.account.userId }).lean();
    expect(events.map((event) => event.action)).toContain('user.suspend');
    expect(events[0]?.actorId).toBe(admin.account.userId);
  });
});

describe('the contact form', () => {
  const message = {
    name: 'Kiran Shah',
    email: 'kiran@example.com',
    phone: '9825012345',
    subject: 'listing',
    message: 'Is the Morbi farmland still available? I can visit this weekend.',
  };

  it('stores the message first and emails about it second', async () => {
    const admin = await actor('admin');

    const response = await request(app).post('/api/v1/contact').send(message).expect(202);
    expect(response.body.received).toBe(true);

    const inbox = await admin.agent.get('/api/v1/admin/contact-messages').expect(200);
    expect(inbox.body.data).toHaveLength(1);
    expect(inbox.body.data[0]).toMatchObject({ name: 'Kiran Shah', status: 'new' });

    const toAdmin = harness.outbox.outbox().find((m) => m.template === 'contact-received');
    expect(toAdmin?.to).toBe(admin.account.email);

    // The sender is told it arrived, so they are not left wondering.
    const acknowledgement = harness.outbox
      .outbox()
      .find((m) => m.template === 'contact-acknowledged');
    expect(acknowledgement?.to).toBe('kiran@example.com');
  });

  it('refuses a message too short to act on', async () => {
    await request(app)
      .post('/api/v1/contact')
      .send({ ...message, message: 'call me' })
      .expect(400);
  });

  it('lets an administrator work through the inbox', async () => {
    const admin = await actor('admin');
    await request(app).post('/api/v1/contact').send(message).expect(202);

    const inbox = await admin.agent.get('/api/v1/admin/contact-messages?status=new').expect(200);
    const id = inbox.body.data[0].id as string;

    await admin.agent
      .patch(`/api/v1/admin/contact-messages/${id}`)
      .set('x-csrf-token', admin.csrf)
      .send({ status: 'replied', note: 'Rang her — sending the Morbi listing.' })
      .expect(200);

    const stillNew = await admin.agent
      .get('/api/v1/admin/contact-messages?status=new')
      .expect(200);
    expect(stillNew.body.data).toHaveLength(0);

    const replied = await admin.agent
      .get('/api/v1/admin/contact-messages?status=replied')
      .expect(200);
    expect(replied.body.data[0].adminNote).toContain('Morbi');
  });

  it('keeps the inbox away from everyone else', async () => {
    const buyer = await actor('buyer');
    await buyer.agent.get('/api/v1/admin/contact-messages').expect(403);
  });
});

describe('timed news and advertisements', () => {
  const day = 24 * 60 * 60 * 1000;

  it('shows an item only inside its window', async () => {
    const admin = await actor('admin');
    const now = Date.now();

    await admin
      .post('/api/v1/admin/news')
      .send({
        title: 'Stamp duty change from April',
        body: 'The revised rates apply to registrations made on or after the first.',
        startsAt: new Date(now - day).toISOString(),
        endsAt: new Date(now + day).toISOString(),
      })
      .expect(201);

    await admin
      .post('/api/v1/admin/news')
      .send({
        title: 'Diwali offer on featured listings',
        body: 'Last year’s campaign, which should no longer be on the homepage.',
        startsAt: new Date(now - 30 * day).toISOString(),
        endsAt: new Date(now - 20 * day).toISOString(),
      })
      .expect(201);

    await admin
      .post('/api/v1/admin/news')
      .send({
        title: 'A campaign that starts next month',
        body: 'Written early, and not to be shown until it begins.',
        startsAt: new Date(now + 20 * day).toISOString(),
      })
      .expect(201);

    const live = await request(app).get('/api/v1/news').expect(200);
    expect(live.body.data).toHaveLength(1);
    expect(live.body.data[0].title).toContain('Stamp duty');

    // The admin sees all three, each labelled with whether it is running.
    const all = await admin.agent.get('/api/v1/admin/news').expect(200);
    expect(all.body.data).toHaveLength(3);
    expect(all.body.data.filter((item: { isLive: boolean }) => item.isLive)).toHaveLength(1);
  });

  it('refuses a window that ends before it starts', async () => {
    const admin = await actor('admin');
    const now = Date.now();

    const response = await admin
      .post('/api/v1/admin/news')
      .send({
        title: 'An impossible campaign',
        body: 'Ending before it has begun.',
        startsAt: new Date(now + day).toISOString(),
        endsAt: new Date(now).toISOString(),
      })
      .expect(400);

    expect(response.body.error.details[0].field).toBe('endsAt');
  });

  it('checks an edited window against the date already stored', async () => {
    const admin = await actor('admin');
    const now = Date.now();

    const created = await admin
      .post('/api/v1/admin/news')
      .send({
        title: 'A perfectly good campaign',
        body: 'Running for a fortnight from today.',
        startsAt: new Date(now).toISOString(),
        endsAt: new Date(now + 14 * day).toISOString(),
      })
      .expect(201);

    // Only the end is supplied; it still has to sit after the stored start.
    await admin
      .patch(`/api/v1/admin/news/${created.body.data.id}`)
      .send({ endsAt: new Date(now - day).toISOString() })
      .expect(400);

    await admin
      .patch(`/api/v1/admin/news/${created.body.data.id}`)
      .send({ endsAt: new Date(now + 30 * day).toISOString() })
      .expect(200);
  });

  it('takes an item down when it is switched off, window or no window', async () => {
    const admin = await actor('admin');

    const created = await admin
      .post('/api/v1/admin/news')
      .send({
        title: 'Something published by mistake',
        body: 'Live right now, and it should not be.',
        startsAt: new Date(Date.now() - day).toISOString(),
      })
      .expect(201);

    expect((await request(app).get('/api/v1/news')).body.data).toHaveLength(1);

    await admin
      .patch(`/api/v1/admin/news/${created.body.data.id}`)
      .send({ isActive: false })
      .expect(200);

    expect((await request(app).get('/api/v1/news')).body.data).toHaveLength(0);

    await admin.del(`/api/v1/admin/news/${created.body.data.id}`).expect(204);
    expect((await admin.agent.get('/api/v1/admin/news')).body.data).toHaveLength(0);
  });

  it('lets nobody but an administrator post one', async () => {
    const broker = await actor('broker');
    await broker
      .post('/api/v1/admin/news')
      .send({
        title: 'My own advertisement',
        body: 'Posted by a broker, which must not be allowed.',
        startsAt: new Date().toISOString(),
      })
      .expect(403);
  });
});
