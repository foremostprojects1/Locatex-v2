import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startHarness, stopHarness, type Harness } from '../helpers/harness.js';

let app: Express;
let harness: Harness;

/** A stub geocoder: no test may reach out to a public geocoding service. */
const geocoderCalls: string[] = [];
const stubGeocoder = {
  lookupPincode: vi.fn(async (pincode: string) => {
    geocoderCalls.push(pincode);
    if (pincode === '363641') {
      return { lat: 22.8117, lng: 70.8319, radiusMetres: 9_400, source: 'nominatim' as const };
    }
    return null;
  }),
};

beforeAll(async () => {
  harness = await startHarness();
  app = harness.app;

  const { setGeocoder } = await import('../../src/container.js');
  setGeocoder(stubGeocoder);

  // India Post is stubbed for the same reason.
  const indiaPost = await import('../../src/infrastructure/geo/indiaPost.js');
  vi.spyOn(indiaPost, 'lookupPostalPincode').mockResolvedValue({
    district: 'Rajkot', // deliberately stale, exactly as the real service reports it
    block: 'Morbi',
    offices: ['Morbi', 'Bagathala'],
  });

  const { seedReferenceData } = await import('../../scripts/seed-reference.js');
  await seedReferenceData();
}, 180_000);

afterAll(async () => {
  const { setGeocoder } = await import('../../src/container.js');
  setGeocoder(undefined);
  await stopHarness();
});

describe('the Gujarat cascade', () => {
  it('lists every district, including the ones created after the GeoNames snapshot', async () => {
    const response = await request(app).get('/api/v1/reference/districts').expect(200);
    const slugs = response.body.data.map((district: { slug: string }) => district.slug);

    expect(response.body.data).toHaveLength(34);
    // These exist only because the district list is curated, not taken from GeoNames.
    expect(slugs).toContain('morbi');
    expect(slugs).toContain('botad');
    expect(slugs).toContain('gir-somnath');
    expect(slugs).toContain('vav-tharad');
    expect(slugs).toContain('devbhoomi-dwarka');
  });

  it('gives every district at least one taluka', async () => {
    const districts = await request(app).get('/api/v1/reference/districts').expect(200);

    for (const district of districts.body.data as Array<{ slug: string; talukaCount: number }>) {
      expect.soft(district.talukaCount, `${district.slug} has no talukas`).toBeGreaterThan(0);
    }
  });

  it('narrows talukas to the district asked for', async () => {
    const response = await request(app)
      .get('/api/v1/reference/talukas?district=morbi')
      .expect(200);

    const names = response.body.data.map((taluka: { name: string }) => taluka.name);
    expect(names).toContain('Morbi');
    expect(names).toContain('Wankaner');
    // Wankaner was Rajkot's before 2013; it must not still appear there.
    const rajkot = await request(app).get('/api/v1/reference/talukas?district=rajkot');
    expect(rajkot.body.data.map((t: { name: string }) => t.name)).not.toContain('Wankaner');
  });

  it('lists villages within a taluka and can filter by prefix', async () => {
    const all = await request(app)
      .get('/api/v1/reference/villages?district=morbi&taluka=morbi')
      .expect(200);
    expect(all.body.data.length).toBeGreaterThan(5);
    expect(all.body.data[0]).toHaveProperty('pincode');

    const filtered = await request(app)
      .get('/api/v1/reference/villages?district=morbi&taluka=morbi&q=ba')
      .expect(200);
    expect(filtered.body.data.length).toBeLessThan(all.body.data.length);
    for (const village of filtered.body.data as Array<{ name: string }>) {
      expect(village.name.toLowerCase().startsWith('ba')).toBe(true);
    }
  });

  it('rejects a request for an unknown district', async () => {
    const response = await request(app).get('/api/v1/reference/talukas?district=nowhere');
    expect(response.status).toBe(404);
  });

  it('answers 304 when the client already has the data', async () => {
    const first = await request(app).get('/api/v1/reference/districts').expect(200);
    // supertest types a header as `string | string[]`; an ETag is always the former.
    const etag = String(first.headers.etag);
    expect(etag).toMatch(/^W\//);

    await request(app)
      .get('/api/v1/reference/districts')
      .set('If-None-Match', etag)
      .expect(304);
  });
});

describe('pincode lookup', () => {
  it('resolves a centroid once and caches it', async () => {
    geocoderCalls.length = 0;

    const first = await request(app).get('/api/v1/reference/pincode/363641').expect(200);
    expect(first.body.district).toBe('morbi');
    expect(first.body.location).toMatchObject({
      lat: 22.8117,
      lng: 70.8319,
      radiusMetres: 9_400,
      source: 'nominatim',
    });
    expect(first.body.villages.length).toBeGreaterThan(5);

    const second = await request(app).get('/api/v1/reference/pincode/363641').expect(200);
    expect(second.body.location.lat).toBe(22.8117);

    // Pincode boundaries do not move: one lookup, then cached forever.
    expect(geocoderCalls).toEqual(['363641']);
  });

  it('reports that India Post disagrees rather than trusting it', async () => {
    const response = await request(app).get('/api/v1/reference/pincode/363641').expect(200);

    expect(response.body.postal.district).toBe('Rajkot'); // what India Post says
    expect(response.body.district).toBe('morbi'); // what is actually true today
    expect(response.body.postal.disagreesWithOurDistrict).toBe(true);
  });

  it('does not invent a location when the geocoder has no answer', async () => {
    const anotherPincode = await request(app).get('/api/v1/reference/pincode/370001').expect(200);
    expect(anotherPincode.body.location).toBeNull();
    expect(anotherPincode.body.district).toBe('kutch');
  });

  it('rejects something that is not a pincode', async () => {
    await request(app).get('/api/v1/reference/pincode/12ab').expect(400);
  });

  it('is honest about a pincode outside Gujarat', async () => {
    const response = await request(app).get('/api/v1/reference/pincode/110001');
    expect(response.status).toBe(404);
    expect(response.body.error.message).toContain('Gujarat');
  });
});

describe('land vocabulary', () => {
  it('serves the v1 amenities and the approved additions', async () => {
    const response = await request(app).get('/api/v1/reference/land-attributes').expect(200);

    const amenities = response.body.amenities.map((a: { slug: string }) => a.slug);
    const disadvantages = response.body.disadvantages.map((d: { slug: string }) => d.slug);

    // Everything v1 offered, so a migrated listing still means what it meant.
    expect(amenities).toEqual(
      expect.arrayContaining(['fencing', 'house-on-land', 'electricity', 'kuvo', 'underground-pipeline']),
    );
    expect(disadvantages).toEqual(
      expect.arrayContaining(['underground-cable', 'borewell-well', 'passing-vijpool', 'passing-canal']),
    );

    // And the additions the client approved.
    expect(amenities).toEqual(
      expect.arrayContaining(['road-pakka', 'water-canal', 'soil-black', 'fencing-barbed', 'electricity-agricultural']),
    );
  });

  it('groups attributes so the form can lay them out', async () => {
    const response = await request(app).get('/api/v1/reference/land-attributes').expect(200);
    const groups = new Set(response.body.amenities.map((a: { group: string }) => a.group));
    expect(groups.size).toBeGreaterThan(2);
  });
});
