import {
  APPROX_RADIUS_M,
  GUEST_MIN_RADIUS_M,
  allowedActions,
  coarsenPoint,
  formatPriceBand,
  publicPriceBand,
  toSqft,
  type AreaUnit,
  type LocationSource,
  type Principal,
  type PropertyStatus,
} from '@locatex/contracts';

/**
 * One listing, three ways.
 *
 * Redaction happens here and nowhere else, and it works by *building* the response rather
 * than by deleting fields from the document. That direction matters: a field added to the
 * schema later is invisible to a guest until someone deliberately adds it below, which is
 * the opposite of a blocklist that leaks every time the model grows.
 *
 * What a guest must never receive (decision D5 and D8, and the permission matrix):
 * the exact price, any contact detail, the government record, the street address, or the
 * exact pin.
 */

export type Audience = 'guest' | 'user' | 'owner';

/** The shape the serializer needs — satisfied by both a hydrated document and a lean one. */
export interface SerializableProperty {
  _id: string;
  brokerId: string;
  title: string;
  description?: string | null;
  propertyType: string;
  listingType: string;
  pricePaise: number;
  priceUnit: string;
  areaValue: number;
  areaUnit: string;
  areaSqft: number;
  govDetails?: { khaataNumber?: string | null; surveyNumber?: string | null; areaText?: string | null } | null;
  location: {
    district: string;
    taluka: string;
    village?: string | null;
    pincode: string;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    precision: string;
    source: string;
    radiusMetres?: number | null;
  };
  amenities?: string[];
  disadvantages?: string[];
  contact: { name: string; email: string; phone: string; whatsapp?: string | null };
  images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  status: string;
  statusHistory?: Array<{
    from: string;
    to: string;
    action: string;
    byUserId: string;
    byRole: string;
    reason?: string | null;
    at: Date;
  }>;
  rejectionReason?: string | null;
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  publishedAt?: Date | null;
  isFeatured?: boolean;
  viewsCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Which view this caller gets. Note that a signed-in broker looking at someone else's
 * listing is an ordinary `user` — ownership, not role, is what unlocks the owner view.
 */
export function audienceFor(principal: Principal, property: { brokerId: string }): Audience {
  if (principal.kind !== 'user') return 'guest';
  if (principal.role === 'admin') return 'owner';
  if (principal.id === property.brokerId) return 'owner';
  return 'user';
}

export function serializeProperty(
  property: SerializableProperty,
  audience: Audience,
): Record<string, unknown> {
  const base = {
    id: property._id,
    title: property.title,
    description: property.description ?? null,
    propertyType: property.propertyType,
    listingType: property.listingType,
    status: property.status,

    area: {
      value: property.areaValue,
      unit: property.areaUnit,
      sqft: property.areaSqft,
    },

    amenities: property.amenities ?? [],
    disadvantages: property.disadvantages ?? [],
    images: (property.images ?? []).map((image) => ({
      url: image.url,
      alt: image.alt ?? '',
      isPrimary: image.isPrimary ?? false,
    })),

    isFeatured: property.isFeatured ?? false,
    viewsCount: property.viewsCount ?? 0,
    publishedAt: property.publishedAt ?? null,
    createdAt: property.createdAt ?? null,
  };

  if (audience === 'guest') {
    return {
      ...base,
      price: null,
      priceBand: guestPriceBand(property.pricePaise),
      priceUnit: property.priceUnit,
      location: guestLocation(property.location),
      contact: null,
      govDetails: null,
    };
  }

  const identified = {
    ...base,
    pricePaise: property.pricePaise,
    priceBand: guestPriceBand(property.pricePaise),
    priceUnit: property.priceUnit,
    location: fullLocation(property.location),
    govDetails: {
      khaataNumber: property.govDetails?.khaataNumber ?? null,
      surveyNumber: property.govDetails?.surveyNumber ?? null,
      areaText: property.govDetails?.areaText ?? null,
    },
    contact: {
      name: property.contact.name,
      email: property.contact.email,
      phone: property.contact.phone,
      whatsapp: property.contact.whatsapp ?? null,
    },
  };

  if (audience === 'user') return identified;

  return {
    ...identified,
    brokerId: property.brokerId,
    rejectionReason: property.rejectionReason ?? null,
    submittedAt: property.submittedAt ?? null,
    approvedAt: property.approvedAt ?? null,
    updatedAt: property.updatedAt ?? null,
    statusHistory: (property.statusHistory ?? []).map((event) => ({
      from: event.from,
      to: event.to,
      action: event.action,
      byRole: event.byRole,
      reason: event.reason ?? null,
      at: event.at,
    })),
  };
}

/** The actions to render as buttons for this caller — the same table the API enforces. */
export function actionsFor(
  property: { brokerId: string; status: string },
  principal: Principal,
): readonly string[] {
  if (principal.kind !== 'user') return [];
  const actor =
    principal.role === 'admin'
      ? 'admin'
      : principal.id === property.brokerId && principal.role === 'broker'
        ? 'owner'
        : null;
  if (!actor) return [];
  return allowedActions(property.status as PropertyStatus, actor);
}

function guestPriceBand(pricePaise: number) {
  const band = publicPriceBand(pricePaise);
  return { lowPaise: band.lowPaise, highPaise: band.highPaise, label: formatPriceBand(band) };
}

/**
 * The circle a guest sees. The point is snapped to a grid rather than jittered, so asking
 * repeatedly cannot average the noise away, and the radius never falls below the grid cell.
 */
function guestLocation(location: SerializableProperty['location']) {
  const point =
    location.lat != null && location.lng != null
      ? coarsenPoint(location.lat, location.lng)
      : null;

  return {
    district: location.district,
    taluka: location.taluka,
    village: location.village ?? null,
    pincode: location.pincode,
    address: null,
    precision: 'approx' as const,
    approxLat: point?.lat ?? null,
    approxLng: point?.lng ?? null,
    radiusMetres: Math.max(radiusOf(location), GUEST_MIN_RADIUS_M),
  };
}

function fullLocation(location: SerializableProperty['location']) {
  return {
    district: location.district,
    taluka: location.taluka,
    village: location.village ?? null,
    pincode: location.pincode,
    address: location.address ?? null,
    precision: location.precision,
    source: location.source,
    lat: location.lat ?? null,
    lng: location.lng ?? null,
    radiusMetres: location.precision === 'exact' ? 0 : radiusOf(location),
  };
}

/** The stored radius if Phase 3 measured one, otherwise the default for that source. */
function radiusOf(location: SerializableProperty['location']): number {
  if (location.radiusMetres != null && location.radiusMetres > 0) return location.radiusMetres;
  return APPROX_RADIUS_M[location.source as LocationSource] ?? APPROX_RADIUS_M.pincode;
}

/** Canonical area, derived on every write so a query never compares vigha against gaj. */
export const canonicalSqft = (value: number, unit: AreaUnit): number =>
  Math.round(toSqft(value, unit));
