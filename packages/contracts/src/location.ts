import { z } from 'zod';

/**
 * How precisely we know where a property is (decision D8). Guests only ever see the circle;
 * the exact pin unlocks with the broker's contact details on login.
 */
export const LOCATION_PRECISIONS = ['exact', 'approx'] as const;
export const locationPrecisionSchema = z.enum(LOCATION_PRECISIONS);
export type LocationPrecision = z.infer<typeof locationPrecisionSchema>;

export const LOCATION_SOURCES = ['pin', 'village', 'taluka', 'pincode', 'geocode'] as const;
export const locationSourceSchema = z.enum(LOCATION_SOURCES);
export type LocationSource = z.infer<typeof locationSourceSchema>;

/** Default circle radii, in metres, when a pin was not dropped. */
export const APPROX_RADIUS_M: Record<LocationSource, number> = {
  pin: 0,
  village: 1_500,
  taluka: 8_000,
  pincode: 6_000,
  geocode: 500,
};

export const pincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode');

/** Gujarat is the whole scope of v2 (see the project brief). */
export const GUJARAT_STATE_CODE = '24';

/**
 * How a point is blurred before it reaches someone who has not signed in.
 *
 * Rounding to a fixed grid rather than adding random jitter is deliberate: a random offset
 * re-rolled on every request would let anyone average a few responses back to the true pin.
 * A grid cell is the same answer every time, so repeating the request reveals nothing more
 * than asking once. 0.01° is roughly 1.1 km north–south, and about 1 km at Gujarat's
 * latitude east–west.
 */
export const APPROX_GRID_DEGREES = 0.01;

/** The smallest circle a guest is ever shown, so the grid cell is never the whole answer. */
export const GUEST_MIN_RADIUS_M = 1_200;

export function coarsenPoint(lat: number, lng: number): { lat: number; lng: number } {
  const snap = (value: number): number =>
    Math.round(Math.round(value / APPROX_GRID_DEGREES) * APPROX_GRID_DEGREES * 1e6) / 1e6;
  return { lat: snap(lat), lng: snap(lng) };
}
