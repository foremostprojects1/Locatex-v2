/**
 * Gujarat land measures. The canonical unit is the square foot; every area is stored in
 * square feet as well as the unit the broker typed, so search can compare listings.
 *
 * 1 acre = 43,560 sqft = 40 guntha · 1 vigha = 17,424 sqft = 16 guntha · 1 gaj = 9 sqft
 */
export const AREA_UNITS = ['vigha', 'guntha', 'gaj', 'sqft', 'acre'] as const;
export type AreaUnit = (typeof AREA_UNITS)[number];

export const AREA_UNIT_SQFT: Record<AreaUnit, number> = {
  vigha: 17_424,
  guntha: 1_089,
  gaj: 9,
  sqft: 1,
  acre: 43_560,
};

export const AREA_UNIT_LABEL: Record<AreaUnit, string> = {
  vigha: 'Vigha',
  guntha: 'Guntha',
  gaj: 'Gaj (sq. yard)',
  sqft: 'Square feet',
  acre: 'Acre',
};

export const toSqft = (value: number, unit: AreaUnit): number => value * AREA_UNIT_SQFT[unit];

export const fromSqft = (sqft: number, unit: AreaUnit): number => sqft / AREA_UNIT_SQFT[unit];

export function convertArea(value: number, from: AreaUnit, to: AreaUnit): number {
  return fromSqft(toSqft(value, from), to);
}
