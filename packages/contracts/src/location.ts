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
