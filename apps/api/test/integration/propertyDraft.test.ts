import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startHarness, stopHarness, resetDatabase, type Harness } from '../helpers/harness.js';
import { registerAndVerify, signIn } from '../helpers/actors.js';

let app: Express;
let harness: Harness;

const stubGeocoder = {
  lookupPincode: vi.fn(async (pincode: string) =>
    pincode === '363641'
      ? { lat: 22.8117, lng: 70.8319, radiusMetres: 9_400, source: 'nominatim' as const }
      : null,
  ),
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

const steps = {
  basics: {
    title: 'Fertile farmland with borewell near Morbi',
    description: 'Level land on the Sanala road.',
    propertyType: 'land',
    listingType: 'rent',
  },
  location: {
    location: {
      district: 'morbi',
      taluka: 'morbi',
      pincode: '363641',
      precision: 'approx',
      source: 'pincode',
    },
  },
  details: {
    pricePaise: 72_00_000_00,
    priceUnit: 'total',
    area: { value: 4, unit: 'vigha' },
    govDetails: { khaataNumber: '412', surveyNumber: '85/2' },
  },
  features: { amenities: ['fencing', 'electricity'], disadvantages: [], images: [] },
  contact: {
    contact: { name: 'Ramesh Patel', email: 'ramesh@example.com', phone: '9876543210' },
  },
};

/** Walks a fresh draft through all five steps, one autosave each, as the wizard does. */
async function fillDraft(broker: Awaited<ReturnType<typeof actor>>): Promise<string> {
  const created = await broker.post('/api/v1/property-drafts').send({}).expect(201);
  const id = created.body.data.id as string;

  for (const [step, data] of Object.entries(steps)) {
    await broker.agent
      .put(`/api/v1/property-drafts/${id}`)
      .set('x-csrf-token', broker.csrf)
      .send({ step, data })
      .expect(200);
  }
  return id;
}

describe('the wizard’s memory', () => {
  it('keeps a half-filled form so a closed tab does not lose it', async () => {
    const broker = await actor('broker');
    const created = await broker.post('/api/v1/property-drafts').send({}).expect(201);
    const id = created.body.data.id as string;

    await broker.agent
      .put(`/api/v1/property-drafts/${id}`)
      .set('x-csrf-token', broker.csrf)
      .send({ step: 'basics', data: steps.basics })
      .expect(200);

    // A different browser, the next morning.
    const reopened = await signIn(app, {
      identifier: broker.account.email,
      password: broker.account.password,
    });
    const resumed = await reopened.agent.get(`/api/v1/property-drafts/${id}`).expect(200);

    expect(resumed.body.data.data.title).toBe(steps.basics.title);
    expect(resumed.body.data.step).toBe('basics');
    expect(resumed.body.data.completed.basics).toBe(true);
    expect(resumed.body.data.completed.location).toBe(false);
    expect(resumed.body.data.isComplete).toBe(false);
  });

  it('merges each step instead of overwriting the ones it says nothing about', async () => {
    const broker = await actor('broker');
    const created = await broker.post('/api/v1/property-drafts').send({}).expect(201);
    const id = created.body.data.id as string;

    await broker.agent
      .put(`/api/v1/property-drafts/${id}`)
      .set('x-csrf-token', broker.csrf)
      .send({ step: 'basics', data: steps.basics })
      .expect(200);

    const afterSecond = await broker.agent
      .put(`/api/v1/property-drafts/${id}`)
      .set('x-csrf-token', broker.csrf)
      .send({ step: 'location', data: steps.location })
      .expect(200);

    // Step one must still be there — a late autosave must not erase what came before.
    expect(afterSecond.body.data.data.title).toBe(steps.basics.title);
    expect(afterSecond.body.data.data.location.district).toBe('morbi');
  });

  it('refuses a value of the wrong shape even mid-wizard', async () => {
    const broker = await actor('broker');
    const created = await broker.post('/api/v1/property-drafts').send({}).expect(201);
    const id = created.body.data.id as string;

    await broker.agent
      .put(`/api/v1/property-drafts/${id}`)
      .set('x-csrf-token', broker.csrf)
      .send({ data: { pricePaise: -1 } })
      .expect(400);

    await broker.agent
      .put(`/api/v1/property-drafts/${id}`)
      .set('x-csrf-token', broker.csrf)
      .send({ data: { somethingInvented: 'yes' } })
      .expect(400);
  });

  it('tells the broker which steps are still unfinished', async () => {
    const broker = await actor('broker');
    const created = await broker.post('/api/v1/property-drafts').send({}).expect(201);
    const id = created.body.data.id as string;

    const response = await broker.agent
      .put(`/api/v1/property-drafts/${id}`)
      .set('x-csrf-token', broker.csrf)
      .send({ step: 'basics', data: { ...steps.basics, ...steps.location } })
      .expect(200);

    expect(response.body.data.completed).toMatchObject({
      basics: true,
      location: true,
      details: false,
      contact: false,
    });
    // Photos and features were never mandatory in v1, so they are not mandatory here.
    expect(response.body.data.completed.features).toBe(true);
  });
});

describe('finishing the wizard', () => {
  it('turns a complete draft into a listing and clears the draft away', async () => {
    const broker = await actor('broker');
    const id = await fillDraft(broker);

    const completed = await broker.post(`/api/v1/property-drafts/${id}/complete`).expect(201);
    expect(completed.body.data.status).toBe('draft');
    expect(completed.body.data.pricePaise).toBe(72_00_000_00);
    expect(completed.body.data.area.sqft).toBe(69_696);
    expect(completed.body.data.location.lat).toBeCloseTo(22.8117, 3);

    await broker.agent.get(`/api/v1/property-drafts/${id}`).expect(404);

    const mine = await broker.agent.get('/api/v1/properties/mine').expect(200);
    expect(mine.body.total).toBe(1);
  });

  it('will not finish a draft that is missing a step', async () => {
    const broker = await actor('broker');
    const created = await broker.post('/api/v1/property-drafts').send({}).expect(201);
    const id = created.body.data.id as string;

    await broker.agent
      .put(`/api/v1/property-drafts/${id}`)
      .set('x-csrf-token', broker.csrf)
      .send({ data: { ...steps.basics, ...steps.location } })
      .expect(200);

    const response = await broker.post(`/api/v1/property-drafts/${id}/complete`).expect(422);
    expect(response.body.error.code).toBe('PROPERTY_NOT_SUBMITTABLE');
    expect(response.body.error.message).toContain('details');
    expect(response.body.error.message).toContain('contact');
  });

  it('still checks the reference data the form offered', async () => {
    const broker = await actor('broker');
    const created = await broker.post('/api/v1/property-drafts').send({}).expect(201);
    const id = created.body.data.id as string;

    await broker.agent
      .put(`/api/v1/property-drafts/${id}`)
      .set('x-csrf-token', broker.csrf)
      .send({
        data: {
          ...steps.basics,
          ...steps.details,
          ...steps.features,
          ...steps.contact,
          location: { ...steps.location.location, district: 'rajkot', taluka: 'wankaner' },
        },
      })
      .expect(200);

    const response = await broker.post(`/api/v1/property-drafts/${id}/complete`).expect(400);
    expect(response.body.error.details[0].field).toBe('location.taluka');
  });
});

describe('editing a listing through the wizard', () => {
  it('opens on what the administrator saw, and saves back onto the same listing', async () => {
    const broker = await actor('broker');
    const id = await fillDraft(broker);
    const created = await broker.post(`/api/v1/property-drafts/${id}/complete`).expect(201);
    const propertyId = created.body.data.id as string;

    const reopened = await broker
      .post('/api/v1/property-drafts')
      .send({ propertyId })
      .expect(201);

    expect(reopened.body.data.propertyId).toBe(propertyId);
    expect(reopened.body.data.data.title).toBe(steps.basics.title);
    expect(reopened.body.data.data.govDetails.surveyNumber).toBe('85/2');
    expect(reopened.body.data.isComplete).toBe(true);

    const draftId = reopened.body.data.id as string;
    await broker.agent
      .put(`/api/v1/property-drafts/${draftId}`)
      .set('x-csrf-token', broker.csrf)
      .send({ data: { pricePaise: 65_00_000_00 } })
      .expect(200);

    await broker.post(`/api/v1/property-drafts/${draftId}/complete`).expect(201);

    const listing = await broker.agent.get(`/api/v1/properties/${propertyId}`).expect(200);
    expect(listing.body.data.pricePaise).toBe(65_00_000_00);

    // One listing, not two: editing must not fork a duplicate.
    const mine = await broker.agent.get('/api/v1/properties/mine').expect(200);
    expect(mine.body.total).toBe(1);
  });

  it('reopens the same draft rather than starting a second one', async () => {
    const broker = await actor('broker');
    const id = await fillDraft(broker);
    const created = await broker.post(`/api/v1/property-drafts/${id}/complete`).expect(201);
    const propertyId = created.body.data.id as string;

    const first = await broker.post('/api/v1/property-drafts').send({ propertyId }).expect(201);
    const second = await broker.post('/api/v1/property-drafts').send({ propertyId }).expect(201);
    expect(second.body.data.id).toBe(first.body.data.id);
  });
});

describe('who may touch a draft', () => {
  it('keeps a buyer and a guest out entirely', async () => {
    const buyer = await actor('buyer');
    await buyer.post('/api/v1/property-drafts').send({}).expect(403);
    await request(app).get('/api/v1/property-drafts').expect(401);
  });

  it('hides one broker’s draft from another', async () => {
    const owner = await actor('broker');
    const stranger = await actor('broker');
    const created = await owner.post('/api/v1/property-drafts').send({}).expect(201);
    const id = created.body.data.id as string;

    await stranger.agent.get(`/api/v1/property-drafts/${id}`).expect(403);
    await stranger.del(`/api/v1/property-drafts/${id}`).expect(403);

    const theirList = await stranger.agent.get('/api/v1/property-drafts').expect(200);
    expect(theirList.body.data).toHaveLength(0);
  });

  it('will not let a broker open a listing that is not theirs', async () => {
    const owner = await actor('broker');
    const stranger = await actor('broker');
    const id = await fillDraft(owner);
    const created = await owner.post(`/api/v1/property-drafts/${id}/complete`).expect(201);

    await stranger
      .post('/api/v1/property-drafts')
      .send({ propertyId: created.body.data.id })
      .expect(403);
  });

  it('lets a broker throw a draft away', async () => {
    const broker = await actor('broker');
    const created = await broker.post('/api/v1/property-drafts').send({}).expect(201);
    const id = created.body.data.id as string;

    await broker.del(`/api/v1/property-drafts/${id}`).expect(204);
    await broker.agent.get(`/api/v1/property-drafts/${id}`).expect(404);
  });
});
