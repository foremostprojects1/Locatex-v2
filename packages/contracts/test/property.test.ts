import { describe, expect, it } from 'vitest';
import {
  PROPERTY_STATUSES,
  PROPERTY_TRANSITIONS,
  allowedActions,
  createPropertySchema,
  findTransition,
  propertySearchSchema,
  type PropertyStatus,
} from '../src/property.js';
import { coarsenPoint } from '../src/location.js';

describe('the listing lifecycle', () => {
  it('lets a broker take a draft all the way to rented', () => {
    const path: Array<[PropertyStatus, string, PropertyStatus]> = [
      ['draft', 'submit', 'pending'],
      ['pending', 'approve', 'approved'],
      ['approved', 'mark-rented', 'rented'],
    ];

    for (const [from, action, to] of path) {
      expect(findTransition(from, action as never)?.to).toBe(to);
    }
  });

  it('refuses to approve something that was never submitted', () => {
    expect(findTransition('draft', 'approve')).toBeUndefined();
    expect(findTransition('rejected', 'approve')).toBeUndefined();
    expect(findTransition('sold', 'approve')).toBeUndefined();
  });

  it('keeps approval and rejection in the administrator’s hands alone', () => {
    expect(findTransition('pending', 'approve')?.by).toEqual(['admin']);
    expect(findTransition('pending', 'reject')?.by).toEqual(['admin']);
    expect(allowedActions('pending', 'owner')).toEqual(['withdraw']);
  });

  it('demands a reason for every move that costs the broker something', () => {
    expect(findTransition('pending', 'reject')?.requiresReason).toBe(true);
    expect(findTransition('approved', 'revoke')?.requiresReason).toBe(true);
    expect(findTransition('pending', 'approve')?.requiresReason).toBeUndefined();
  });

  it('gives a rejected listing a way back', () => {
    expect(allowedActions('rejected', 'owner')).toContain('submit');
    expect(allowedActions('withdrawn', 'owner')).toContain('submit');
    expect(allowedActions('sold', 'owner')).toContain('relist');
  });

  it('never lets a listing reach a status the enum does not know', () => {
    for (const transition of PROPERTY_TRANSITIONS) {
      expect(PROPERTY_STATUSES).toContain(transition.from);
      expect(PROPERTY_STATUSES).toContain(transition.to);
    }
  });

  it('describes exactly one destination per (status, action) pair', () => {
    const seen = new Set<string>();
    for (const transition of PROPERTY_TRANSITIONS) {
      const key = `${transition.from}:${transition.action}`;
      expect(seen.has(key), `${key} is defined twice`).toBe(false);
      seen.add(key);
    }
  });

  it('leaves a draft with nothing for an administrator to decide yet', () => {
    expect(allowedActions('draft', 'admin')).toEqual(['submit']);
  });
});

describe('listing input', () => {
  const valid = {
    title: 'Fertile farmland near Morbi',
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
  };

  it('accepts a listing located only by its pincode', () => {
    expect(createPropertySchema.parse(valid).location.precision).toBe('approx');
  });

  it('will not call a location exact without a pin', () => {
    const result = createPropertySchema.safeParse({
      ...valid,
      location: { ...valid.location, precision: 'exact', source: 'pincode' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts an exact location when the pin is really there', () => {
    const result = createPropertySchema.safeParse({
      ...valid,
      location: { ...valid.location, precision: 'exact', source: 'pin', lat: 22.81, lng: 70.83 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects a pin that is not in Gujarat', () => {
    const result = createPropertySchema.safeParse({
      ...valid,
      location: { ...valid.location, precision: 'exact', source: 'pin', lat: 28.61, lng: 77.2 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a field nobody declared, rather than ignoring it', () => {
    const result = createPropertySchema.safeParse({ ...valid, isFeatured: true });
    expect(result.success).toBe(false);
  });
});

describe('search input', () => {
  it('reads the query string a browser actually sends', () => {
    const parsed = propertySearchSchema.parse({
      district: 'morbi',
      priceMinPaise: '2500000000',
      areaMin: '2',
      amenities: 'fencing,electricity',
      limit: '10',
    });

    expect(parsed.priceMinPaise).toBe(2_500_000_000);
    expect(parsed.amenities).toEqual(['fencing', 'electricity']);
    expect(parsed.sort).toBe('newest');
    expect(parsed.limit).toBe(10);
  });

  it('refuses a price range that runs backwards', () => {
    const result = propertySearchSchema.safeParse({
      priceMinPaise: '9000000000',
      priceMaxPaise: '1000000000',
    });
    expect(result.success).toBe(false);
  });

  it('refuses half a coordinate', () => {
    expect(propertySearchSchema.safeParse({ lat: '22.8' }).success).toBe(false);
    expect(propertySearchSchema.safeParse({ lat: '22.8', lng: '70.8' }).success).toBe(true);
  });
});

describe('blurring a location for a guest', () => {
  it('gives the same answer every time, so repeating the request reveals nothing', () => {
    const first = coarsenPoint(22.81174, 70.83192);
    const second = coarsenPoint(22.81174, 70.83192);
    expect(first).toEqual(second);
  });

  it('moves the point by roughly a kilometre at most', () => {
    const point = coarsenPoint(22.81174, 70.83192);
    expect(Math.abs(point.lat - 22.81174)).toBeLessThan(0.005);
    expect(Math.abs(point.lng - 70.83192)).toBeLessThan(0.005);
  });

  it('collapses nearby plots onto one point, which is what hides them', () => {
    expect(coarsenPoint(22.8117, 70.8319)).toEqual(coarsenPoint(22.8134, 70.8302));
  });
});
