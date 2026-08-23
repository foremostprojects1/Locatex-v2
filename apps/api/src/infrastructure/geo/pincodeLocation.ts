import { PincodeModel } from '../db/models/Reference.js';
import { logger } from '../observability/logger.js';

/**
 * Where a pincode actually is.
 *
 * The seeded GeoNames point is a hint, not an answer — its own documentation says the
 * coordinates are algorithmic, and for pincode 363641 the average of its villages lands
 * about 90 km from Morbi town. So a centroid is resolved from a geocoder the first time it
 * is needed and then cached forever: pincode boundaries do not move.
 *
 * Nominatim is used because it returns a bounding box, which gives the "approximate"
 * listing circle a measured radius instead of a guessed one. Its usage policy asks for a
 * genuine User-Agent and at most one request per second, both of which are honoured here.
 */

export interface ResolvedPincode {
  pincode: string;
  lat: number;
  lng: number;
  radiusMetres: number;
  source: 'nominatim' | 'google' | 'manual';
}

export interface Geocoder {
  lookupPincode(pincode: string): Promise<Omit<ResolvedPincode, 'pincode'> | null>;
}

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const MIN_INTERVAL_MS = 1_100;
const MAX_ATTEMPTS = 3;

let lastCallAt = 0;

export class NominatimGeocoder implements Geocoder {
  constructor(
    private readonly userAgent = 'LocateX/1.0 (support@locatex.in)',
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async lookupPincode(pincode: string): Promise<Omit<ResolvedPincode, 'pincode'> | null> {
    // Serialise calls, as the usage policy requires.
    const wait = Math.max(0, lastCallAt + MIN_INTERVAL_MS - Date.now());
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastCallAt = Date.now();

    const url = `${NOMINATIM_ENDPOINT}?postalcode=${encodeURIComponent(pincode)}&country=India&format=json&limit=1`;
    const response = await this.fetchImpl(url, {
      headers: { 'User-Agent': this.userAgent, 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) throw new Error(`nominatim responded ${response.status}`);

    const results = (await response.json()) as Array<{
      lat: string;
      lon: string;
      boundingbox?: [string, string, string, string];
    }>;
    const first = results[0];
    if (!first) return null;

    const lat = Number(first.lat);
    const lng = Number(first.lon);

    return {
      lat,
      lng,
      radiusMetres: radiusFromBoundingBox(lat, lng, first.boundingbox),
      source: 'nominatim',
    };
  }
}

/**
 * Half the diagonal of the bounding box: the smallest circle centred on the point that
 * still covers the area the geocoder described. Clamped so a missing or absurd box cannot
 * produce a circle that covers half of Gujarat, or one so small it implies false precision.
 */
export function radiusFromBoundingBox(
  lat: number,
  lng: number,
  box: [string, string, string, string] | undefined,
): number {
  const FALLBACK = 3_000;
  if (!box) return FALLBACK;

  const [south, north, west, east] = box.map(Number) as [number, number, number, number];
  if ([south, north, west, east].some((value) => !Number.isFinite(value))) return FALLBACK;

  const halfHeight = metresBetween(south, lng, north, lng) / 2;
  const halfWidth = metresBetween(lat, west, lat, east) / 2;
  const radius = Math.round(Math.hypot(halfHeight, halfWidth));

  return Math.min(Math.max(radius, 800), 25_000);
}

export function metresBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Returns the cached centroid, resolving it once if we have never looked it up.
 *
 * Failures are recorded rather than retried in a loop: a pincode the geocoder does not
 * know will not start knowing it because we asked four times a second.
 */
export async function resolvePincode(
  pincode: string,
  geocoder: Geocoder,
): Promise<ResolvedPincode | null> {
  const record = await PincodeModel.findById(pincode);
  if (!record) return null;

  if (record.centroid?.lat != null && record.centroid?.lng != null && record.radiusMetres) {
    return {
      pincode,
      lat: record.centroid.lat,
      lng: record.centroid.lng,
      radiusMetres: record.radiusMetres,
      source: (record.source ?? 'manual') as ResolvedPincode['source'],
    };
  }

  if ((record.attempts ?? 0) >= MAX_ATTEMPTS) return null;

  try {
    const resolved = await geocoder.lookupPincode(pincode);
    record.attempts = (record.attempts ?? 0) + 1;
    record.lastAttemptAt = new Date();

    if (!resolved) {
      await record.save();
      return null;
    }

    record.centroid = { lat: resolved.lat, lng: resolved.lng };
    record.radiusMetres = resolved.radiusMetres;
    record.source = resolved.source;
    record.resolvedAt = new Date();
    await record.save();

    return { pincode, ...resolved };
  } catch (error) {
    record.attempts = (record.attempts ?? 0) + 1;
    record.lastAttemptAt = new Date();
    await record.save();
    logger.warn({ pincode, err: error }, 'pincode geocoding failed');
    return null;
  }
}
