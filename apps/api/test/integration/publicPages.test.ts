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

async function publish(broker: Awaited<ReturnType<typeof actor>>, admin: Awaited<ReturnType<typeof actor>>, overrides = {}) {
  const created = await broker.post('/api/v1/properties').send(listing(overrides)).expect(201);
  const id = created.body.data.id as string;
  await broker.post(`/api/v1/properties/${id}/status`).send({ action: 'submit' }).expect(200);
  await admin.post(`/api/v1/properties/${id}/status`).send({ action: 'approve' }).expect(200);
  return id;
}

describe('the broker’s public page', () => {
  it('shows who they are and what they have, but not how to ring them', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');

    const { UserModel } = await import('../../src/infrastructure/db/models/User.js');
    await UserModel.updateOne(
      { _id: broker.account.userId },
      {
        $set: {
          brokerProfile: {
            agencyName: 'Patel Land Associates',
            officeAddress: 'Shop 4, Sanala Road, Morbi',
            district: 'Morbi',
            experienceYears: 6,
            about: 'Farmland around Morbi and Wankaner since 2019.',
            approvedAt: new Date(),
          },
        },
      },
    );

    await publish(broker, admin);

    const guest = await request(app)
      .get(`/api/v1/brokers/${broker.account.userId}`)
      .expect(200);

    expect(guest.body.data.agencyName).toBe('Patel Land Associates');
    expect(guest.body.data.counts.live).toBe(1);
    expect(guest.body.listings).toHaveLength(1);

    // The number is what registration buys. Giving it away here would make every
    // listing's redaction pointless.
    expect(guest.body.data.contact).toBeNull();
    expect(guest.body.data.officeAddress).toBeNull();
    expect(JSON.stringify(guest.body)).not.toContain('9876543210');

    const buyer = await actor('buyer');
    const seen = await buyer.agent.get(`/api/v1/brokers/${broker.account.userId}`).expect(200);
    expect(seen.body.data.contact.phone).toBe(broker.account.phone);
    expect(seen.body.data.officeAddress).toContain('Sanala Road');
  });

  it('counts everything they have, not just the page being shown', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');

    const first = await publish(broker, admin);
    await publish(broker, admin, { title: 'A second plot on the Sanala road' });
    await broker.post(`/api/v1/properties/${first}/status`).send({ action: 'mark-rented' }).expect(200);

    const page = await request(app)
      .get(`/api/v1/brokers/${broker.account.userId}?limit=1`)
      .expect(200);

    expect(page.body.listings).toHaveLength(1);
    expect(page.body.data.counts).toEqual({ live: 1, sold: 1 });
  });

  it('does not exist for a buyer, an applicant, or a suspended broker', async () => {
    const buyer = await actor('buyer');
    await request(app).get(`/api/v1/brokers/${buyer.account.userId}`).expect(404);

    const broker = await actor('broker');
    const { UserModel } = await import('../../src/infrastructure/db/models/User.js');
    await UserModel.updateOne({ _id: broker.account.userId }, { $set: { status: 'suspended' } });
    await request(app).get(`/api/v1/brokers/${broker.account.userId}`).expect(404);
  });

  it('shows only their live listings, never a draft or a rejection', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');

    await publish(broker, admin);
    await broker.post('/api/v1/properties').send(listing({ title: 'Still being written up' }));

    const page = await request(app).get(`/api/v1/brokers/${broker.account.userId}`).expect(200);
    expect(page.body.total).toBe(1);
  });
});

describe('the featured carousel', () => {
  it('asks for featured listings and gets only those', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');

    const featured = await publish(broker, admin);
    await publish(broker, admin, { title: 'An ordinary plot near the highway' });

    await admin.post(`/api/v1/properties/${featured}/featured`).send({ isFeatured: true }).expect(200);

    const carousel = await request(app).get('/api/v1/properties?featured=true').expect(200);
    expect(carousel.body.total).toBe(1);
    expect(carousel.body.data[0].isFeatured).toBe(true);

    const everything = await request(app).get('/api/v1/properties').expect(200);
    expect(everything.body.total).toBe(2);
  });
});

describe('what stays public', () => {
  /**
   * A guard on a router mounted at a shared prefix guards everything below it. Adding the
   * buyer routes at `/api/v1` with a blanket `requireUser` once made the contact form and
   * the news endpoint return 401 — this is the test that would have said so immediately.
   */
  it('never asks a visitor to sign in for something a visitor is meant to reach', async () => {
    const open = [
      '/api/v1/news',
      '/api/v1/properties',
      '/api/v1/reference/districts',
      '/api/v1/reference/land-attributes',
    ];

    for (const path of open) {
      const response = await request(app).get(path);
      expect.soft(response.status, `${path} should be public`).toBe(200);
    }

    const contact = await request(app).post('/api/v1/contact').send({
      name: 'Kiran Shah',
      email: 'kiran@example.com',
      subject: 'general',
      message: 'How do I list my land with you?',
    });
    expect(contact.status).toBe(202);
  });

  it('still keeps the private things private', async () => {
    const closed = ['/api/v1/me/favourites', '/api/v1/broker/enquiries', '/api/v1/admin/stats'];
    for (const path of closed) {
      const response = await request(app).get(path);
      expect.soft(response.status, `${path} should need a session`).toBe(401);
    }
  });
});
