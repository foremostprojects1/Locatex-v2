import { describe, expect, it } from 'vitest';
import { AREA_UNIT_SQFT, convertArea, fromSqft, toSqft } from '../src/area.js';

describe('Gujarat area conversion', () => {
  it('keeps the relationships the market uses', () => {
    expect(convertArea(1, 'vigha', 'guntha')).toBe(16);
    expect(convertArea(1, 'acre', 'guntha')).toBe(40);
    expect(convertArea(1, 'vigha', 'acre')).toBeCloseTo(0.4, 10);
    expect(convertArea(1, 'gaj', 'sqft')).toBe(9);
    expect(convertArea(1, 'acre', 'sqft')).toBe(43_560);
  });

  it('round-trips through the canonical square foot', () => {
    for (const unit of Object.keys(AREA_UNIT_SQFT) as Array<keyof typeof AREA_UNIT_SQFT>) {
      expect(fromSqft(toSqft(12.5, unit), unit)).toBeCloseTo(12.5, 10);
    }
  });

  it('converts a realistic listing', () => {
    // "12 Vigha canal-touch land" — what the detail page must be able to show
    expect(convertArea(12, 'vigha', 'sqft')).toBe(209_088);
    expect(convertArea(12, 'vigha', 'acre')).toBeCloseTo(4.8, 10);
  });
});
