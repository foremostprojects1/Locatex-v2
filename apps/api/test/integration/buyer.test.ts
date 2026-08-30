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
  listingType: 'rent',
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

async function publish(
  broker: Awaited<ReturnType<typeof actor>>,
  admin: Awaited<ReturnType<typeof actor>>,
  overrides = {},
) {
  const created = await broker.post('/api/v1/properties').send(listing(overrides)).expect(201);
  const id = created.body.data.id as string;
  await broker.post(`/api/v1/properties/${id}/status`).send({ action: 'submit' }).expect(200);
  await admin.post(`/api/v1/properties/${id}/status`).send({ action: 'approve' }).expect(200);
  return id;
}

describe('saved listings', () => {
  it('belong to the account, not to the browser', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    await buyer.agent
      .put(`/api/v1/me/favourites/${id}`)
      .set('x-csrf-token', buyer.csrf)
      .expect(204);

    // A different device, the same person.
    const elsewhere = await signIn(app, {
      identifier: buyer.account.email,
      password: buyer.account.password,
    });
    const saved = await elsewhere.agent.get('/api/v1/me/favourites').expect(200);

    expect(saved.body.total).toBe(1);
    expect(saved.body.data[0].id).toBe(id);
    // Signed in, so the real price and the broker's number are there.
    expect(saved.body.data[0].pricePaise).toBe(72_00_000_00);
  });

  it('treats saving twice as saving once', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    // A double tap on a slow connection sends this twice.
    await Promise.all([
      buyer.agent.put(`/api/v1/me/favourites/${id}`).set('x-csrf-token', buyer.csrf),
      buyer.agent.put(`/api/v1/me/favourites/${id}`).set('x-csrf-token', buyer.csrf),
    ]);

    const saved = await buyer.agent.get('/api/v1/me/favourites').expect(200);
    expect(saved.body.total).toBe(1);
  });

  it('says when something saved is no longer available rather than quietly dropping it', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    await buyer.agent.put(`/api/v1/me/favourites/${id}`).set('x-csrf-token', buyer.csrf).expect(204);
    await broker.post(`/api/v1/properties/${id}/status`).send({ action: 'withdraw' }).expect(200);

    const saved = await buyer.agent.get('/api/v1/me/favourites').expect(200);
    expect(saved.body.data).toHaveLength(0);
    expect(saved.body.unavailable).toBe(1);
    expect(saved.body.total).toBe(1);
  });

  it('will not save something nobody can see', async () => {
    const broker = await actor('broker');
    const buyer = await actor('buyer');
    const draft = await broker.post('/api/v1/properties').send(listing()).expect(201);

    // Otherwise a draft's id could be probed for existence by watching which saves work.
    await buyer.agent
      .put(`/api/v1/me/favourites/${draft.body.data.id}`)
      .set('x-csrf-token', buyer.csrf)
      .expect(404);
  });

  it('is not something a visitor can do at all', async () => {
    await request(app).get('/api/v1/me/favourites').expect(401);
  });

  it('can be undone', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    await buyer.agent.put(`/api/v1/me/favourites/${id}`).set('x-csrf-token', buyer.csrf).expect(204);
    await buyer.del(`/api/v1/me/favourites/${id}`).expect(204);

    const ids = await buyer.agent.get('/api/v1/me/favourites/ids').expect(200);
    expect(ids.body.data).toEqual([]);
  });
});

describe('being shown a broker’s number', () => {
  it('is recorded once a day, however often the page is opened', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    await buyer.agent.get(`/api/v1/properties/${id}`).expect(200);
    await buyer.agent.get(`/api/v1/properties/${id}`).expect(200);
    await buyer.agent.get(`/api/v1/properties/${id}`).expect(200);

    const { ContactUnlockModel } = await import('../../src/infrastructure/db/models/Buyer.js');
    // Three refreshes are one interested buyer, not three.
    expect(await ContactUnlockModel.countDocuments({ propertyId: id })).toBe(1);

    const stats = await broker.agent.get('/api/v1/broker/stats').expect(200);
    expect(stats.body.data.contactUnlocks30Days).toBe(1);
  });

  it('is not recorded for a visitor, who is never shown the number', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const id = await publish(broker, admin);

    const guest = await request(app).get(`/api/v1/properties/${id}`).expect(200);
    expect(guest.body.data.contact).toBeNull();

    const { ContactUnlockModel } = await import('../../src/infrastructure/db/models/Buyer.js');
    expect(await ContactUnlockModel.countDocuments({})).toBe(0);
  });

  it('is not recorded for the broker reading their own listing', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const id = await publish(broker, admin);

    await broker.agent.get(`/api/v1/properties/${id}`).expect(200);

    const { ContactUnlockModel } = await import('../../src/infrastructure/db/models/Buyer.js');
    expect(await ContactUnlockModel.countDocuments({})).toBe(0);
  });
});

describe('asking a broker about a listing', () => {
  const enquiry = {
    message: 'Is the borewell working, and can I visit this Saturday morning?',
    channel: 'visit',
  };

  it('reaches the broker with a way to answer', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    await buyer.post(`/api/v1/properties/${id}/enquiries`).send(enquiry).expect(202);

    const mail = harness.outbox.outbox().find((m) => m.template === 'enquiry-received');
    expect(mail?.to).toBe(broker.account.email);
    // A broker reading this on a phone should be one tap from answering.
    expect(mail?.data.buyerPhone).toBe(buyer.account.phone);
    expect(mail?.data.message).toContain('borewell');

    const inbox = await broker.agent.get('/api/v1/broker/enquiries').expect(200);
    expect(inbox.body.data).toHaveLength(1);
    expect(inbox.body.data[0].channel).toBe('visit');
  });

  it('uses the callback number when one is given', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    await buyer
      .post(`/api/v1/properties/${id}/enquiries`)
      .send({ ...enquiry, callbackPhone: '9825012345' })
      .expect(202);

    const mail = harness.outbox.outbox().find((m) => m.template === 'enquiry-received');
    expect(mail?.data.buyerPhone).toBe('9825012345');
  });

  it('refuses a message too short to act on', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    await buyer
      .post(`/api/v1/properties/${id}/enquiries`)
      .send({ message: 'interested' })
      .expect(400);
  });

  it('will not let the same person ask the same thing all afternoon', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    await buyer.post(`/api/v1/properties/${id}/enquiries`).send(enquiry).expect(202);
    const again = await buyer.post(`/api/v1/properties/${id}/enquiries`).send(enquiry).expect(409);
    expect(again.body.error.message).toContain('already asked');
  });

  it('will not let a broker enquire about their own listing', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const id = await publish(broker, admin);

    await broker.post(`/api/v1/properties/${id}/enquiries`).send(enquiry).expect(409);
  });

  it('shows a broker only their own enquiries, and lets them work through them', async () => {
    const broker = await actor('broker');
    const other = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    await buyer.post(`/api/v1/properties/${id}/enquiries`).send(enquiry).expect(202);

    const theirs = await other.agent.get('/api/v1/broker/enquiries').expect(200);
    expect(theirs.body.data).toHaveLength(0);

    const mine = await broker.agent.get('/api/v1/broker/enquiries?status=new').expect(200);
    const enquiryId = mine.body.data[0].id as string;

    // Another broker must not be able to mark it read.
    await other
      .patch(`/api/v1/broker/enquiries/${enquiryId}`)
      .send({ status: 'replied' })
      .expect(403);

    await broker
      .patch(`/api/v1/broker/enquiries/${enquiryId}`)
      .send({ status: 'replied' })
      .expect(200);

    const stillNew = await broker.agent.get('/api/v1/broker/enquiries?status=new').expect(200);
    expect(stillNew.body.data).toHaveLength(0);
  });

  it('lets a buyer see what they have asked', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    await buyer.post(`/api/v1/properties/${id}/enquiries`).send(enquiry).expect(202);

    const sent = await buyer.agent.get('/api/v1/me/enquiries').expect(200);
    expect(sent.body.data).toHaveLength(1);
    expect(sent.body.data[0].propertyId).toBe(id);
  });
});
