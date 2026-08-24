import {
  LIVE_STATUSES,
  areaFilterSqft,
  propertySearchSchema,
  type AreaUnit,
  type PropertySearchInput,
  type PropertySort,
  type PropertyStatus,
} from '@locatex/contracts';
import mongoose from 'mongoose';
import { PropertyModel } from '../../infrastructure/db/models/Property.js';
import type { SerializableProperty } from '../../domain/property/serialize.js';
import { AppError } from '../../shared/AppError.js';

/**
 * Browsing and searching listings.
 *
 * Pagination is keyset, not skip/limit. On a listings page that people scroll, `skip`
 * degrades as the offset grows and — worse — silently repeats or drops rows whenever a
 * listing is approved while someone is paging. A cursor made of (sort value, id) is stable
 * under concurrent writes and costs the same on page 40 as on page 1.
 */

export interface SearchOptions {
  /** Defaults to live listings only. The broker dashboard and the admin queue widen it. */
  statuses?: readonly PropertyStatus[];
  brokerId?: string;
}

export interface SearchPage {
  items: SerializableProperty[];
  nextCursor: string | null;
  total: number;
}

interface SortPlan {
  field: '_id' | 'pricePaise' | 'areaSqft';
  direction: 1 | -1;
}

const SORTS: Record<PropertySort, SortPlan> = {
  newest: { field: '_id', direction: -1 },
  'price-asc': { field: 'pricePaise', direction: 1 },
  'price-desc': { field: 'pricePaise', direction: -1 },
  'area-desc': { field: 'areaSqft', direction: -1 },
};

const EARTH_RADIUS_KM = 6_378.1;

/**
 * Marks an operator object as one we wrote.
 *
 * Mongoose runs with `sanitizeFilter` on globally, which wraps any value containing a `$`
 * key in `$eq` — that is what stops `?price[$ne]=` in a query string from becoming a real
 * operator. It cannot tell our `$gte` from an injected one, so every filter this module
 * builds from validated input says so explicitly rather than turning the protection off.
 */
const op = <T extends object>(operator: T): T => mongoose.trusted(operator) as T;

export async function searchProperties(
  input: PropertySearchInput | Record<string, unknown>,
  options: SearchOptions = {},
): Promise<SearchPage> {
  const query = propertySearchSchema.parse(input);
  const filter = buildFilter(query, options);
  const plan = SORTS[query.sort];

  const [total, rows] = await Promise.all([
    PropertyModel.countDocuments(filter),
    PropertyModel.find(withCursor(filter, plan, query.cursor))
      .sort(sortSpec(plan))
      .limit(query.limit + 1)
      .lean(),
  ]);

  const hasMore = rows.length > query.limit;
  const items = hasMore ? rows.slice(0, query.limit) : rows;
  const last = items[items.length - 1];

  return {
    // The single cast in this module. Mongoose's inferred `lean()` type is structurally
    // the serializer's input but not nominally assignable to it, and widening the
    // serializer to accept `unknown` would defeat the point of having the interface.
    items: items as unknown as SerializableProperty[],
    nextCursor: hasMore && last ? encodeCursor(cursorValue(last, plan), String(last._id)) : null,
    total,
  };
}

function buildFilter(
  query: PropertySearchInput,
  options: SearchOptions,
): Record<string, unknown> {
  const statuses = options.statuses ?? LIVE_STATUSES;
  const filter: Record<string, unknown> = {
    deletedAt: null,
    status: statuses.length === 1 ? statuses[0] : op({ $in: [...statuses] }),
  };

  if (options.brokerId) filter.brokerId = options.brokerId;

  if (query.district) filter['location.district'] = query.district;
  if (query.taluka) filter['location.taluka'] = query.taluka;
  if (query.village) filter['location.village'] = query.village;
  if (query.pincode) filter['location.pincode'] = query.pincode;

  if (query.propertyType) filter.propertyType = query.propertyType;
  if (query.listingType) filter.listingType = query.listingType;

  const price = range(query.priceMinPaise, query.priceMaxPaise);
  if (price) filter.pricePaise = price;

  const unit = query.areaUnit as AreaUnit;
  const area = range(areaFilterSqft(query.areaMin, unit), areaFilterSqft(query.areaMax, unit));
  if (area) filter.areaSqft = area;

  // Every requested amenity must be present, not just one of them: a buyer who asks for
  // fencing and electricity means both.
  if (query.amenities.length > 0) filter.amenities = op({ $all: query.amenities });

  if (query.q) filter.$text = op({ $search: query.q });

  if (query.featured !== undefined) filter.isFeatured = query.featured;

  if (query.lat != null && query.lng != null) {
    assertOnEarth(query.lat, query.lng);
    filter.geo = op({
      $geoWithin: { $centerSphere: [[query.lng, query.lat], query.radiusKm / EARTH_RADIUS_KM] },
    });
  }

  return filter;
}

const range = (min?: number, max?: number): Record<string, number> | null => {
  if (min == null && max == null) return null;
  return op({ ...(min != null ? { $gte: min } : {}), ...(max != null ? { $lte: max } : {}) });
};

function sortSpec(plan: SortPlan): Record<string, 1 | -1> {
  // `_id` is always the tie-breaker, otherwise two listings at the same price would swap
  // places between pages and the cursor would skip one of them.
  return plan.field === '_id'
    ? { _id: plan.direction }
    : { [plan.field]: plan.direction, _id: plan.direction };
}

/** The keyset predicate: everything strictly after the last row of the previous page. */
function withCursor(
  filter: Record<string, unknown>,
  plan: SortPlan,
  cursor: string | undefined,
): Record<string, unknown> {
  if (!cursor) return filter;
  const decoded = decodeCursor(cursor);
  const operator = plan.direction === -1 ? '$lt' : '$gt';

  if (plan.field === '_id') {
    return { ...filter, _id: op({ [operator]: decoded.id }) };
  }
  if (decoded.value == null) {
    throw AppError.validation([{ field: 'cursor', code: 'invalid', message: 'Start again from the first page.' }]);
  }

  return {
    ...filter,
    $and: [
      ...(Array.isArray(filter.$and) ? (filter.$and as unknown[]) : []),
      {
        $or: [
          { [plan.field]: op({ [operator]: decoded.value }) },
          { [plan.field]: decoded.value, _id: op({ [operator]: decoded.id }) },
        ],
      },
    ],
  };
}

const cursorValue = (row: Record<string, unknown>, plan: SortPlan): number | null =>
  plan.field === '_id' ? null : Number(row[plan.field] ?? 0);

/**
 * Opaque on purpose. It carries no secret, but a client that starts parsing it is a client
 * that breaks the day the sort changes.
 */
function encodeCursor(value: number | null, id: string): string {
  return Buffer.from(JSON.stringify({ v: value, i: id }), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string): { value: number | null; id: string } {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (parsed == null || typeof parsed !== 'object') throw new Error('not an object');

    const { v, i } = parsed as { v?: unknown; i?: unknown };
    // Checked rather than trusted: the cursor is a round-tripped string from the client,
    // so an object here would land straight inside a query operator.
    if (typeof i !== 'string' || i.length === 0) throw new Error('missing id');
    if (v != null && typeof v !== 'number') throw new Error('sort value is not a number');

    return { value: v ?? null, id: i };
  } catch {
    throw AppError.validation([
      { field: 'cursor', code: 'invalid', message: 'That page link is no longer valid.' },
    ]);
  }
}

/**
 * A radius search is the one place a caller supplies raw coordinates, and unlike a listing
 * they are not constrained to Gujarat — a browser's geolocation can legitimately be just
 * over the border. They must still be a real point on the planet.
 */
function assertOnEarth(lat: number, lng: number): void {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw AppError.validation([
      { field: 'lat', code: 'invalid', message: 'That is not a point on the map.' },
    ]);
  }
}
