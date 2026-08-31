import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startHarness, stopHarness, resetDatabase, type Harness } from '../helpers/harness.js';
import { registerAndVerify, signIn } from '../helpers/actors.js';

let app: Express;
let harness: Harness;

/** No test may reach a public geocoding service; 363641 is Morbi. */
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

// ---------------------------------------------------------------------------
// Actors
// ---------------------------------------------------------------------------

async function setRole(userId: string, role: 'broker' | 'admin'): Promise<void> {
  const { UserModel } = await import('../../src/infrastructure/db/models/User.js');
  await UserModel.updateOne({ _id: userId }, { $set: { role } });
}

async function actor(role: 'buyer' | 'broker' | 'admin') {
  const account = await registerAndVerify(app, harness.outbox);
  if (role !== 'buyer') await setRole(account.userId, role);
  const session = await signIn(app, {
    identifier: account.email,
    password: account.password,
  });
  return { ...session, account };
}

type Session = Awaited<ReturnType<typeof actor>>;

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------

const listing = (overrides: Record<string, unknown> = {}) => ({
  title: 'Fertile farmland with borewell near Morbi',
  description: 'Level land on the Sanala road, suitable for cotton.',
  propertyType: 'land',
  listingType: 'rent',
  pricePaise: 72_00_000_00,
  priceUnit: 'total',
  area: { value: 4, unit: 'vigha' },
  govDetails: { khaataNumber: '412', surveyNumber: '85/2', areaText: '૦-૬૪-૭૫' },
  location: {
    district: 'morbi',
    taluka: 'morbi',
    pincode: '363641',
    precision: 'approx',
    source: 'pincode',
  },
  amenities: ['fencing', 'electricity'],
  disadvantages: [],
  contact: { name: 'Ramesh Patel', email: 'ramesh@example.com', phone: '9876543210' },
  images: [{ url: '/api/v1/images/01JBXYZPHOTO0000000000', alt: 'the plot' }],
  ...overrides,
});

/** Creates a listing and walks it to `approved`, returning its id. */
async function publish(
  broker: Session,
  admin: Session,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const created = await broker.post('/api/v1/properties').send(listing(overrides)).expect(201);
  const id = created.body.data.id as string;
  await broker.post(`/api/v1/properties/${id}/status`).send({ action: 'submit' }).expect(200);
  await admin.post(`/api/v1/properties/${id}/status`).send({ action: 'approve' }).expect(200);
  return id;
}

// ---------------------------------------------------------------------------

describe('creating a listing', () => {
  it('starts as a draft that only the broker can see', async () => {
    const broker = await actor('broker');
    const response = await broker.post('/api/v1/properties').send(listing()).expect(201);

    expect(response.body.data.status).toBe('draft');
    expect(response.body.data.area.sqft).toBe(69_696); // 4 vigha
    expect(response.body.actions).toEqual(['submit']);

    await request(app).get(`/api/v1/properties/${response.body.data.id}`).expect(404);
  });

  it('resolves the pincode to a point so the listing can appear on a map', async () => {
    const broker = await actor('broker');
    const response = await broker.post('/api/v1/properties').send(listing()).expect(201);

    expect(response.body.data.location.lat).toBeCloseTo(22.8117, 3);
    expect(response.body.data.location.radiusMetres).toBe(9_400);
    expect(response.body.data.location.source).toBe('pincode');
  });

  it('keeps a broker’s own pin exactly where they put it', async () => {
    const broker = await actor('broker');
    const response = await broker
      .post('/api/v1/properties')
      .send(
        listing({
          location: {
            district: 'morbi',
            taluka: 'wankaner',
            pincode: '363641',
            precision: 'exact',
            source: 'pin',
            lat: 22.6134,
            lng: 70.9421,
            address: 'Survey 85/2, off the Wankaner bypass',
          },
        }),
      )
      .expect(201);

    expect(response.body.data.location.lat).toBe(22.6134);
    expect(response.body.data.location.precision).toBe('exact');
    expect(response.body.data.location.radiusMetres).toBe(0);
  });

  it('refuses a buyer and a guest', async () => {
    const buyer = await actor('buyer');
    await buyer.post('/api/v1/properties').send(listing()).expect(403);
    await request(app).post('/api/v1/properties').send(listing()).expect(401);
  });

  it('refuses a district, taluka or amenity we do not have', async () => {
    const broker = await actor('broker');

    const badDistrict = await broker
      .post('/api/v1/properties')
      .send(listing({ location: { ...listing().location, district: 'nowhere' } }))
      .expect(400);
    expect(badDistrict.body.error.details[0].field).toBe('location.district');

    const badTaluka = await broker
      .post('/api/v1/properties')
      .send(listing({ location: { ...listing().location, taluka: 'wankaner-fake' } }))
      .expect(400);
    expect(badTaluka.body.error.details[0].field).toBe('location.taluka');

    const badAmenity = await broker
      .post('/api/v1/properties')
      .send(listing({ amenities: ['helipad'] }))
      .expect(400);
    expect(badAmenity.body.error.details[0].field).toBe('amenities');
  });

  it('rejects a taluka that belongs to a different district', async () => {
    const broker = await actor('broker');
    // Wankaner moved to Morbi in 2013; claiming it under Rajkot must not be accepted.
    const response = await broker
      .post('/api/v1/properties')
      .send(listing({ location: { ...listing().location, district: 'rajkot', taluka: 'wankaner' } }))
      .expect(400);
    expect(response.body.error.details[0].field).toBe('location.taluka');
  });
});

describe('the approval flow', () => {
  it('carries a listing from draft to live, telling both sides', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');

    const created = await broker.post('/api/v1/properties').send(listing()).expect(201);
    const id = created.body.data.id as string;

    const submitted = await broker
      .post(`/api/v1/properties/${id}/status`)
      .send({ action: 'submit' })
      .expect(200);
    expect(submitted.body.data.status).toBe('pending');
    expect(submitted.body.data.submittedAt).not.toBeNull();

    const toAdmin = harness.outbox.outbox().find((m) => m.template === 'property-submitted');
    expect(toAdmin?.to).toBe(admin.account.email);

    const approved = await admin
      .post(`/api/v1/properties/${id}/status`)
      .send({ action: 'approve' })
      .expect(200);
    expect(approved.body.data.status).toBe('approved');
    expect(approved.body.data.publishedAt).not.toBeNull();

    const toBroker = harness.outbox.outbox().find((m) => m.template === 'property-approved');
    expect(toBroker?.to).toBe(broker.account.email);
  });

  it('will not let a broker approve their own listing', async () => {
    const broker = await actor('broker');
    const created = await broker.post('/api/v1/properties').send(listing()).expect(201);
    const id = created.body.data.id as string;

    await broker.post(`/api/v1/properties/${id}/status`).send({ action: 'submit' }).expect(200);
    const response = await broker
      .post(`/api/v1/properties/${id}/status`)
      .send({ action: 'approve' })
      .expect(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects an illegal move rather than silently doing nothing', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const id = await publish(broker, admin);

    const again = await admin
      .post(`/api/v1/properties/${id}/status`)
      .send({ action: 'approve' })
      .expect(409);
    expect(again.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('demands a reason before a rejection reaches the broker', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');

    const created = await broker.post('/api/v1/properties').send(listing()).expect(201);
    const id = created.body.data.id as string;
    await broker.post(`/api/v1/properties/${id}/status`).send({ action: 'submit' }).expect(200);

    const noReason = await admin
      .post(`/api/v1/properties/${id}/status`)
      .send({ action: 'reject' })
      .expect(400);
    expect(noReason.body.error.code).toBe('VALIDATION_FAILED');
    expect(harness.outbox.outbox().some((m) => m.template === 'property-rejected')).toBe(false);

    const rejected = await admin
      .post(`/api/v1/properties/${id}/status`)
      .send({ action: 'reject', reason: 'The survey number does not match the 7/12 extract.' })
      .expect(200);
    expect(rejected.body.data.status).toBe('rejected');
    expect(rejected.body.data.rejectionReason).toContain('7/12');

    const mail = harness.outbox.outbox().find((m) => m.template === 'property-rejected');
    expect(mail?.data.reason).toContain('7/12');
  });

  it('gives a rejected listing a way back into the queue', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');

    const created = await broker.post('/api/v1/properties').send(listing()).expect(201);
    const id = created.body.data.id as string;
    await broker.post(`/api/v1/properties/${id}/status`).send({ action: 'submit' });
    await admin
      .post(`/api/v1/properties/${id}/status`)
      .send({ action: 'reject', reason: 'Photographs show a different plot.' });

    const resubmitted = await broker
      .post(`/api/v1/properties/${id}/status`)
      .send({ action: 'submit' })
      .expect(200);

    expect(resubmitted.body.data.status).toBe('pending');
    // The old reason must not follow a listing that has been fixed and sent back.
    expect(resubmitted.body.data.rejectionReason).toBeNull();
  });

  it('refuses to call a rental listing sold', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const id = await publish(broker, admin);

    // Every listing is a rental in this release, so `sold` is unreachable — and the guard
    // says so rather than quietly moving the listing into a state nothing can leave.
    await broker.post(`/api/v1/properties/${id}/status`).send({ action: 'mark-sold' }).expect(409);
    await broker.post(`/api/v1/properties/${id}/status`).send({ action: 'mark-rented' }).expect(200);
  });

  it('records every move, and who made it', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const id = await publish(broker, admin);

    const detail = await broker.agent.get(`/api/v1/properties/${id}`).expect(200);
    const history = detail.body.data.statusHistory as Array<{ action: string; byRole: string }>;

    expect(history.map((event) => event.action)).toEqual(['submit', 'approve']);
    expect(history[1]?.byRole).toBe('admin');

    const { AuditEventModel } = await import('../../src/infrastructure/db/models/AuditEvent.js');
    const audited = await AuditEventModel.find({ subjectId: id }).lean();
    expect(audited.map((event) => event.action)).toContain('property.approve');
  });
});

describe('an administrator posting their own land', () => {
  it('publishes straight to live, without a review queue', async () => {
    const admin = await actor('admin');

    const created = await admin.post('/api/v1/properties').send(listing()).expect(201);
    const id = created.body.data.id as string;

    // Review exists so somebody other than the poster has checked it. When the poster is
    // that somebody, a queue they would immediately approve from is ceremony.
    expect(created.body.actions).toContain('publish');

    const published = await admin
      .post(`/api/v1/properties/${id}/status`)
      .send({ action: 'publish' })
      .expect(200);

    expect(published.body.data.status).toBe('approved');
    expect(published.body.data.publishedAt).not.toBeNull();

    // And it is genuinely public, not merely marked approved.
    const asGuest = await request(app).get(`/api/v1/properties/${id}`).expect(200);
    expect(asGuest.body.data.title).toBe(listing().title);
  });

  it('records that it was published, not that it was reviewed', async () => {
    const admin = await actor('admin');
    const created = await admin.post('/api/v1/properties').send(listing()).expect(201);
    const id = created.body.data.id as string;

    await admin.post(`/api/v1/properties/${id}/status`).send({ action: 'publish' }).expect(200);

    const detail = await admin.agent.get(`/api/v1/properties/${id}`).expect(200);
    const history = detail.body.data.statusHistory as Array<{ action: string; byRole: string }>;

    // A listing that never went through review must not look as though it did.
    expect(history.map((event) => event.action)).toEqual(['publish']);
    expect(history[0]?.byRole).toBe('admin');
  });

  it('still refuses to publish something half written', async () => {
    const admin = await actor('admin');
    const { PropertyModel } = await import('../../src/infrastructure/db/models/Property.js');

    const created = await admin.post('/api/v1/properties').send(listing()).expect(201);
    const id = created.body.data.id as string;

    // Skipping review is not skipping the completeness check.
    await PropertyModel.updateOne({ _id: id }, { $set: { pricePaise: 0 } });

    const response = await admin
      .post(`/api/v1/properties/${id}/status`)
      .send({ action: 'publish' })
      .expect(422);
    expect(response.body.error.code).toBe('PROPERTY_NOT_SUBMITTABLE');
  });

  it('is not offered to a broker', async () => {
    const broker = await actor('broker');
    const created = await broker.post('/api/v1/properties').send(listing()).expect(201);

    expect(created.body.actions).not.toContain('publish');
    await broker
      .post(`/api/v1/properties/${created.body.data.id}/status`)
      .send({ action: 'publish' })
      .expect(403);
  });
});

describe('what a guest is allowed to see', () => {
  it('gives a band instead of the price, and no way to contact anyone', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const id = await publish(broker, admin);

    const response = await request(app).get(`/api/v1/properties/${id}`).expect(200);
    const body = response.body.data;

    expect(body.pricePaise).toBeUndefined();
    expect(body.price).toBeNull();
    expect(body.contact).toBeNull();
    expect(body.govDetails).toBeNull();
    expect(body.location.address).toBeNull();

    expect(body.priceBand.lowPaise).toBeLessThan(72_00_000_00);
    expect(body.priceBand.highPaise).toBeGreaterThan(72_00_000_00);
    expect(body.priceBand.label).toBe('₹60 L – ₹90 L');

    // The band must not give the price back as its midpoint.
    const midpoint = (body.priceBand.lowPaise + body.priceBand.highPaise) / 2;
    expect(midpoint).not.toBe(72_00_000_00);

    // Nothing anywhere in the response may contain the exact figure or the phone number.
    const raw = JSON.stringify(body);
    expect(raw).not.toContain('720000000');
    expect(raw).not.toContain('9876543210');
    expect(raw).not.toContain('ramesh@example.com');
    expect(raw).not.toContain('85/2');
  });

  it('never hands over an exact pin, even when the broker dropped one', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const id = await publish(broker, admin, {
      location: {
        district: 'morbi',
        taluka: 'morbi',
        pincode: '363641',
        precision: 'exact',
        source: 'pin',
        lat: 22.81174,
        lng: 70.83192,
        address: 'Survey 85/2, Sanala Road',
      },
    });

    const guest = await request(app).get(`/api/v1/properties/${id}`).expect(200);
    const location = guest.body.data.location;

    expect(location.lat).toBeUndefined();
    expect(location.lng).toBeUndefined();
    expect(location.precision).toBe('approx');
    expect(location.approxLat).not.toBe(22.81174);
    expect(location.radiusMetres).toBeGreaterThanOrEqual(1_200);

    // Asking twice must not produce two different points to average.
    const again = await request(app).get(`/api/v1/properties/${id}`).expect(200);
    expect(again.body.data.location.approxLat).toBe(location.approxLat);
    expect(again.body.data.location.approxLng).toBe(location.approxLng);

    // The broker still sees exactly where it is.
    const owner = await broker.agent.get(`/api/v1/properties/${id}`).expect(200);
    expect(owner.body.data.location.lat).toBe(22.81174);
  });

  it('redacts every row of a search result, not only the detail page', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    await publish(broker, admin);
    await publish(broker, admin, { title: 'Second plot on the Sanala road' });

    const response = await request(app).get('/api/v1/properties').expect(200);
    expect(response.body.data).toHaveLength(2);

    for (const item of response.body.data) {
      expect(item.contact).toBeNull();
      expect(item.pricePaise).toBeUndefined();
      expect(item.priceBand.label).toBeTruthy();
    }
    expect(JSON.stringify(response.body)).not.toContain('9876543210');
  });

  it('cannot see a listing that is not live', async () => {
    const broker = await actor('broker');
    const created = await broker.post('/api/v1/properties').send(listing()).expect(201);
    const id = created.body.data.id as string;
    await broker.post(`/api/v1/properties/${id}/status`).send({ action: 'submit' }).expect(200);

    // The same 404 as a listing that does not exist: whether one is under review is not public.
    await request(app).get(`/api/v1/properties/${id}`).expect(404);
    await broker.agent.get(`/api/v1/properties/${id}`).expect(200);

    const search = await request(app).get('/api/v1/properties').expect(200);
    expect(search.body.data).toHaveLength(0);
  });
});

describe('what a signed-in buyer gets', () => {
  it('sees the exact price and how to reach the broker', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    const response = await buyer.agent.get(`/api/v1/properties/${id}`).expect(200);
    const body = response.body.data;

    expect(body.pricePaise).toBe(72_00_000_00);
    expect(body.contact.phone).toBe('9876543210');
    expect(body.govDetails.surveyNumber).toBe('85/2');
    expect(body.location.lat).toBeCloseTo(22.8117, 3);
  });

  it('is still not shown the review history of somebody else’s listing', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const buyer = await actor('buyer');
    const id = await publish(broker, admin);

    const response = await buyer.agent.get(`/api/v1/properties/${id}`).expect(200);
    expect(response.body.data.statusHistory).toBeUndefined();
    expect(response.body.data.brokerId).toBeUndefined();
    expect(response.body.actions).toEqual([]);
  });
});

describe('searching', () => {
  it('narrows by place, type and price', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');

    await publish(broker, admin, { pricePaise: 30_00_000_00 });
    await publish(broker, admin, {
      pricePaise: 95_00_000_00,
      location: { district: 'rajkot', taluka: 'rajkot', pincode: '360001', precision: 'approx', source: 'pincode' },
    });

    const morbi = await request(app).get('/api/v1/properties?district=morbi').expect(200);
    expect(morbi.body.total).toBe(1);

    const cheap = await request(app)
      .get('/api/v1/properties?priceMaxPaise=500000000')
      .expect(200);
    expect(cheap.body.total).toBe(1);
    expect(cheap.body.data[0].priceBand.highPaise).toBeLessThanOrEqual(500_000_000);
  });

  it('compares areas typed in different units', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');

    await publish(broker, admin, { area: { value: 2, unit: 'vigha' } }); // 34,848 sqft
    await publish(broker, admin, { area: { value: 1, unit: 'acre' } }); // 43,560 sqft

    // "at least 40,000 sqft" must find the acre and not the two vigha.
    const bySqft = await request(app)
      .get('/api/v1/properties?areaMin=40000&areaUnit=sqft')
      .expect(200);
    expect(bySqft.body.total).toBe(1);
    expect(bySqft.body.data[0].area.unit).toBe('acre');
  });

  it('finds listings within a radius and leaves the far ones out', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');

    const near = (lat: number, lng: number) => ({
      location: {
        district: 'morbi',
        taluka: 'morbi',
        pincode: '363641',
        precision: 'exact' as const,
        source: 'pin' as const,
        lat,
        lng,
      },
    });

    await publish(broker, admin, near(22.8117, 70.8319)); // Morbi
    await publish(broker, admin, near(21.1702, 72.8311)); // Surat, ~250 km away

    const around = await request(app)
      .get('/api/v1/properties?lat=22.81&lng=70.83&radiusKm=25')
      .expect(200);
    expect(around.body.total).toBe(1);
  });

  it('pages without repeating or losing a listing', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    for (let index = 0; index < 5; index += 1) {
      await publish(broker, admin, { title: `Plot number ${index} on the Sanala road` });
    }

    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;

    do {
      const url: string = cursor
        ? `/api/v1/properties?limit=2&cursor=${encodeURIComponent(cursor)}`
        : '/api/v1/properties?limit=2';
      const page = await request(app).get(url).expect(200);
      seen.push(...page.body.data.map((item: { id: string }) => item.id));
      cursor = page.body.nextCursor;
      pages += 1;
    } while (cursor && pages < 10);

    expect(seen).toHaveLength(5);
    expect(new Set(seen).size).toBe(5);
  });

  it('pages a price sort without dropping ties', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    for (const price of [30_00_000_00, 30_00_000_00, 45_00_000_00, 60_00_000_00]) {
      await publish(broker, admin, { pricePaise: price });
    }

    const first = await request(app)
      .get('/api/v1/properties?sort=price-asc&limit=2')
      .expect(200);
    const second = await request(app)
      .get(`/api/v1/properties?sort=price-asc&limit=2&cursor=${encodeURIComponent(first.body.nextCursor)}`)
      .expect(200);

    const ids = [...first.body.data, ...second.body.data].map((item: { id: string }) => item.id);
    expect(new Set(ids).size).toBe(4);

    const bands = [...first.body.data, ...second.body.data].map(
      (item: { priceBand: { lowPaise: number } }) => item.priceBand.lowPaise,
    );
    expect(bands).toEqual([...bands].sort((a, b) => a - b));
  });

  it('refuses a cursor somebody made up', async () => {
    await request(app).get('/api/v1/properties?cursor=not-a-cursor').expect(400);
  });
});

describe('editing', () => {
  it('lets a broker change anything while it is a draft', async () => {
    const broker = await actor('broker');
    const created = await broker.post('/api/v1/properties').send(listing()).expect(201);
    const id = created.body.data.id as string;

    const updated = await broker
      .patch(`/api/v1/properties/${id}`)
      .send({ area: { value: 6, unit: 'vigha' }, pricePaise: 80_00_000_00 })
      .expect(200);

    expect(updated.body.data.area.sqft).toBe(104_544);
    expect(updated.body.data.pricePaise).toBe(80_00_000_00);
  });

  it('freezes what was reviewed once a listing is live, but not the price', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const id = await publish(broker, admin);

    const priceCut = await broker
      .patch(`/api/v1/properties/${id}`)
      .send({ pricePaise: 65_00_000_00 })
      .expect(200);
    expect(priceCut.body.data.pricePaise).toBe(65_00_000_00);

    const areaChange = await broker
      .patch(`/api/v1/properties/${id}`)
      .send({ area: { value: 40, unit: 'vigha' } })
      .expect(409);
    expect(areaChange.body.error.code).toBe('INVALID_STATE_TRANSITION');

    // Not even an administrator may quietly rewrite a reviewed government record.
    await admin
      .patch(`/api/v1/properties/${id}`)
      .send({ govDetails: { surveyNumber: '99/9' } })
      .expect(409);
  });

  it('keeps one broker out of another broker’s listing', async () => {
    const owner = await actor('broker');
    const stranger = await actor('broker');
    const created = await owner.post('/api/v1/properties').send(listing()).expect(201);
    const id = created.body.data.id as string;

    const response = await stranger
      .patch(`/api/v1/properties/${id}`)
      .send({ title: 'Now this is mine, apparently' })
      .expect(403);
    expect(response.body.error.code).toBe('NOT_OWNER');

    await stranger
      .post(`/api/v1/properties/${id}/status`)
      .send({ action: 'submit' })
      .expect(403);
  });

  it('shows a broker their own listings in every status', async () => {
    const broker = await actor('broker');
    const other = await actor('broker');
    await broker.post('/api/v1/properties').send(listing()).expect(201);
    await other.post('/api/v1/properties').send(listing()).expect(201);

    const mine = await broker.agent.get('/api/v1/properties/mine').expect(200);
    expect(mine.body.total).toBe(1);
    expect(mine.body.data[0].status).toBe('draft');
    expect(mine.body.data[0].actions).toEqual(['submit']);
  });
});

describe('views and featuring', () => {
  it('counts a visitor but not the broker checking their own page', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const id = await publish(broker, admin);

    await request(app).get(`/api/v1/properties/${id}`).expect(200);
    await request(app).get(`/api/v1/properties/${id}`).expect(200);
    await broker.agent.get(`/api/v1/properties/${id}`).expect(200);

    const final = await request(app).get(`/api/v1/properties/${id}`).expect(200);
    // Three guest reads happened before this one, which is itself counted afterwards.
    expect(final.body.data.viewsCount).toBe(2);
  });

  it('lets an administrator feature a live listing, and nobody else', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const id = await publish(broker, admin);

    await broker.post(`/api/v1/properties/${id}/featured`).send({ isFeatured: true }).expect(403);

    const featured = await admin
      .post(`/api/v1/properties/${id}/featured`)
      .send({ isFeatured: true })
      .expect(200);
    expect(featured.body.data.isFeatured).toBe(true);
  });

  it('will not feature something the public cannot even open', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const created = await broker.post('/api/v1/properties').send(listing()).expect(201);

    await admin
      .post(`/api/v1/properties/${created.body.data.id}/featured`)
      .send({ isFeatured: true })
      .expect(409);
  });
});
