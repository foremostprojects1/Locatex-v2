import { describe, expect, it } from 'vitest';
import {
  PRICE_BAND_STEP_PAISE,
  PRICE_RUNGS_PAISE,
  formatIndianShort,
  formatPriceBand,
  priceBand,
  publicPriceBand,
} from '../src/price.js';

const rupees = (value: number) => value * 100;
const REAL_PRICES = [
  4_150_000, 5_800_000, 7_200_000, 9_600_000, 11_500_000, 2_500_000, 41_000_000, 150_000,
];

describe('public price band (decision D5, revised)', () => {
  it('cannot be inverted — the band never identifies a single price', () => {
    // The guarantee that matters: for every price, some *other* price renders the same
    // band, so a guest reading the band learns the range and nothing more. (The midpoint
    // may coincide with the price by chance — that is not an inversion, unlike the raw
    // ±10% window below, where the midpoint is *always* exactly the price.)
    for (const price of REAL_PRICES) {
      const band = publicPriceBand(rupees(price));
      const others = [price * 1.03, price * 0.97, price + 100_000]
        .filter((candidate) => candidate >= 0)
        .map((candidate) => publicPriceBand(rupees(candidate)));
      expect(
        others.some(
          (other) => other.lowPaise === band.lowPaise && other.highPaise === band.highPaise,
        ),
      ).toBe(true);
    }
  });

  it('always contains the real price', () => {
    for (const price of REAL_PRICES) {
      const band = publicPriceBand(rupees(price));
      expect(band.lowPaise).toBeLessThanOrEqual(rupees(price));
      expect(band.highPaise).toBeGreaterThanOrEqual(rupees(price));
    }
  });

  it('maps different prices onto the same band, so a band identifies no single price', () => {
    // The property that makes the band non-invertible.
    const a = publicPriceBand(rupees(7_200_000));
    const b = publicPriceBand(rupees(7_500_000));
    expect(a).toEqual(b);
  });

  it('reports only rungs from the published ladder', () => {
    for (const price of REAL_PRICES) {
      const band = publicPriceBand(rupees(price));
      expect(PRICE_RUNGS_PAISE).toContain(band.lowPaise);
      expect(PRICE_RUNGS_PAISE).toContain(band.highPaise);
    }
  });

  it('reads naturally', () => {
    expect(formatPriceBand(publicPriceBand(rupees(7_200_000)))).toBe('₹60 L – ₹90 L');
    expect(formatPriceBand(publicPriceBand(rupees(150_000)))).toBe('Under ₹5 L');
  });

  it('floors at zero rather than going negative', () => {
    expect(publicPriceBand(0).lowPaise).toBe(0);
  });

  it('rejects a negative price', () => {
    expect(() => publicPriceBand(-1)).toThrow(RangeError);
  });
});

describe('raw ±10% window (internal input to the public band)', () => {
  it('rounds outward to ₹1 lakh steps', () => {
    const band = priceBand(rupees(7_200_000));
    expect(band.lowPaise).toBe(rupees(6_400_000));
    expect(band.highPaise).toBe(rupees(8_000_000));
  });

  it('is symmetric, which is exactly why it must not be published alone', () => {
    const band = priceBand(rupees(7_200_000));
    expect((band.lowPaise + band.highPaise) / 2).toBe(rupees(7_200_000));
  });

  it('uses the documented step size', () => {
    expect(PRICE_BAND_STEP_PAISE).toBe(100_000 * 100);
  });
});

describe('Indian short money format', () => {
  it('reads the way the market reads prices', () => {
    expect(formatIndianShort(rupees(7_200_000))).toBe('₹72 L');
    expect(formatIndianShort(rupees(11_500_000))).toBe('₹1.15 Cr');
    expect(formatIndianShort(rupees(4_150_000))).toBe('₹41.5 L');
    expect(formatIndianShort(rupees(45_000))).toBe('₹45,000');
  });
});
