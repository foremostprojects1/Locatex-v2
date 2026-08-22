import { describe, expect, it } from 'vitest';
import {
  APPROX_RADIUS_M,
  GUJARAT_STATE_CODE,
  locationPrecisionSchema,
  pincodeSchema,
} from '../src/location.js';

describe('location precision', () => {
  it('has exactly the two states the product defines', () => {
    expect(locationPrecisionSchema.options).toEqual(['exact', 'approx']);
  });

  it('gives a dropped pin no radius and every guess a real one', () => {
    expect(APPROX_RADIUS_M.pin).toBe(0);
    for (const source of ['village', 'taluka', 'pincode', 'geocode'] as const) {
      expect(APPROX_RADIUS_M[source]).toBeGreaterThan(0);
    }
    // A taluka guess must never look tighter than a village guess.
    expect(APPROX_RADIUS_M.taluka).toBeGreaterThan(APPROX_RADIUS_M.village);
  });
});

describe('pincode', () => {
  it('accepts real Gujarat pincodes', () => {
    for (const pin of ['363641', '360001', '380015']) {
      expect(pincodeSchema.safeParse(pin).success).toBe(true);
    }
  });

  it('rejects malformed input', () => {
    for (const pin of ['36364', '0363641', 'abc123', '', '363 641']) {
      expect(pincodeSchema.safeParse(pin).success).toBe(false);
    }
  });
});

describe('scope', () => {
  it('is Gujarat', () => {
    expect(GUJARAT_STATE_CODE).toBe('24');
  });
});
