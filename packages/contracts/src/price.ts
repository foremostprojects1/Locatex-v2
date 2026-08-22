/**
 * Price visibility (decision D5, revised).
 *
 * Guests never receive the exact price — only a band. The originally approved rule was
 * "±10%, rounded outward to ₹1 lakh steps", but that does not achieve the goal: because the
 * band is symmetric around the price and land prices are round numbers, the exact figure is
 * recoverable as the midpoint. ₹72,00,000 → ₹64 L – ₹80 L → midpoint ₹72,00,000.
 *
 * The public band therefore snaps outward to a fixed ladder of rungs. Many prices map to the
 * same band, the rungs are unevenly spaced, and nothing in the response identifies where in
 * the band the real price sits — which is what "price range" in the brief actually asks for.
 *
 * Money is stored in paise as an integer everywhere.
 */
export const PRICE_BAND_STEP_PAISE = 100_000 * 100; // ₹1,00,000 — used by the raw ±10% rule

const L = 100_000 * 100; // one lakh, in paise
const CR = 100 * L; // one crore, in paise

/**
 * The rungs a public band may report. Deliberately coarse at the top, where a 10% window is
 * worth more money than most buyers' entire budget.
 */
export const PRICE_RUNGS_PAISE: readonly number[] = [
  0,
  5 * L,
  10 * L,
  15 * L,
  20 * L,
  25 * L,
  30 * L,
  40 * L,
  50 * L,
  60 * L,
  75 * L,
  90 * L,
  1.1 * CR,
  1.25 * CR,
  1.5 * CR,
  2 * CR,
  2.5 * CR,
  3 * CR,
  4 * CR,
  5 * CR,
  7.5 * CR,
  10 * CR,
  15 * CR,
  25 * CR,
];

export interface PriceBand {
  lowPaise: number;
  highPaise: number;
}

const assertPrice = (pricePaise: number): void => {
  if (!Number.isFinite(pricePaise) || pricePaise < 0) {
    throw new RangeError('price must be a non-negative number of paise');
  }
};

/**
 * The raw ±10% window, rounded outward to `stepPaise`. Kept because it is the input to the
 * public band — do **not** send this to a client on its own; see the note above.
 */
export function priceBand(
  pricePaise: number,
  stepPaise: number = PRICE_BAND_STEP_PAISE,
): PriceBand {
  assertPrice(pricePaise);
  return {
    lowPaise: Math.floor(Math.max(0, pricePaise * 0.9) / stepPaise) * stepPaise,
    highPaise: Math.ceil((pricePaise * 1.1) / stepPaise) * stepPaise,
  };
}

/**
 * The band a guest sees: the ±10% window widened outward to the nearest ladder rungs.
 * This is the only price shape that may leave the API for an unauthenticated request.
 */
export function publicPriceBand(pricePaise: number): PriceBand {
  assertPrice(pricePaise);
  const raw = priceBand(pricePaise);
  const top = PRICE_RUNGS_PAISE[PRICE_RUNGS_PAISE.length - 1] as number;

  let low = 0;
  for (const rung of PRICE_RUNGS_PAISE) {
    if (rung <= raw.lowPaise) low = rung;
    else break;
  }
  const high = PRICE_RUNGS_PAISE.find((rung) => rung >= raw.highPaise) ?? top;

  return { lowPaise: low, highPaise: high };
}

/** "₹64 L", "₹1.2 Cr" — how prices are read in the market. */
export function formatIndianShort(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 10_000_000) return `₹${trim(rupees / 10_000_000)} Cr`;
  if (rupees >= 100_000) return `₹${trim(rupees / 100_000)} L`;
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(rupees)}`;
}

const trim = (value: number): string =>
  value
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1');

export function formatPriceBand(band: PriceBand): string {
  if (band.lowPaise === 0) return `Under ${formatIndianShort(band.highPaise)}`;
  const top = PRICE_RUNGS_PAISE[PRICE_RUNGS_PAISE.length - 1] as number;
  if (band.highPaise >= top && band.lowPaise >= top) {
    return `${formatIndianShort(band.lowPaise)}+`;
  }
  return `${formatIndianShort(band.lowPaise)} – ${formatIndianShort(band.highPaise)}`;
}
