import { z } from 'zod';
import { AREA_UNITS, toSqft, type AreaUnit } from './area.js';
import { locationPrecisionSchema, locationSourceSchema, pincodeSchema } from './location.js';
import { emailSchema, phoneSchema } from './auth.js';

/**
 * What a listing is, and what may happen to it. Shared by the API (which enforces it) and
 * the web app (which renders the form and the action buttons from the same tables), so the
 * two can never disagree about a valid price, a legal transition, or who may make it.
 */

export const PROPERTY_TYPES = [
  'land',
  'plot',
  'house',
  'apartment',
  'commercial',
  'industrial',
] as const;
export const propertyTypeSchema = z.enum(PROPERTY_TYPES);
export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const LISTING_TYPES = ['sale', 'rent'] as const;
export const listingTypeSchema = z.enum(LISTING_TYPES);
export type ListingType = z.infer<typeof listingTypeSchema>;

/** Land in Gujarat is quoted per vigha as often as it is quoted as a total. */
export const PRICE_UNITS = ['total', 'per_vigha', 'per_acre', 'per_sqft'] as const;
export const priceUnitSchema = z.enum(PRICE_UNITS);
export type PriceUnit = z.infer<typeof priceUnitSchema>;

export const INSERTED_BY = ['owner', 'broker'] as const;
export const insertedBySchema = z.enum(INSERTED_BY);

export const PROPERTY_STATUSES = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'sold',
  'rented',
  'withdrawn',
] as const;
export const propertyStatusSchema = z.enum(PROPERTY_STATUSES);
export type PropertyStatus = z.infer<typeof propertyStatusSchema>;

/** Only these are visible to someone who does not own them. */
export const PUBLIC_STATUSES: readonly PropertyStatus[] = ['approved', 'sold', 'rented'];

/** A listing still open to offers — what a search returns unless asked otherwise. */
export const LIVE_STATUSES: readonly PropertyStatus[] = ['approved'];

// ---------------------------------------------------------------------------
// The state machine
// ---------------------------------------------------------------------------

export const PROPERTY_ACTIONS = [
  'submit',
  'approve',
  'reject',
  'withdraw',
  'mark-sold',
  'mark-rented',
  'relist',
  'revoke',
] as const;
export const propertyActionSchema = z.enum(PROPERTY_ACTIONS);
export type PropertyAction = z.infer<typeof propertyActionSchema>;

/** Who is allowed to move a listing: the broker who owns it, or an administrator. */
export type TransitionActor = 'owner' | 'admin';

export interface StatusTransition {
  readonly from: PropertyStatus;
  readonly action: PropertyAction;
  readonly to: PropertyStatus;
  readonly by: readonly TransitionActor[];
  /** Required for the audit trail and the email that follows. */
  readonly requiresReason?: boolean;
}

/**
 * The whole lifecycle as data. Every move a listing can make is one row here — there is no
 * second place where a status is assigned, which is what stops the "approved but never
 * reviewed" class of bug that scattered `if` statements produce.
 *
 *   draft ──submit──► pending ──approve──► approved ──mark-sold──► sold
 *                        │                    │                      │
 *                        │                    └──withdraw──► withdrawn
 *                        └──reject──► rejected ──submit──► pending
 */
export const PROPERTY_TRANSITIONS: readonly StatusTransition[] = [
  { from: 'draft', action: 'submit', to: 'pending', by: ['owner', 'admin'] },
  { from: 'pending', action: 'approve', to: 'approved', by: ['admin'] },
  { from: 'pending', action: 'reject', to: 'rejected', by: ['admin'], requiresReason: true },
  { from: 'pending', action: 'withdraw', to: 'withdrawn', by: ['owner', 'admin'] },

  // A rejection is not the end: the broker fixes what was wrong and sends it back.
  { from: 'rejected', action: 'submit', to: 'pending', by: ['owner', 'admin'] },
  { from: 'withdrawn', action: 'submit', to: 'pending', by: ['owner', 'admin'] },

  { from: 'approved', action: 'mark-sold', to: 'sold', by: ['owner', 'admin'] },
  { from: 'approved', action: 'mark-rented', to: 'rented', by: ['owner', 'admin'] },
  { from: 'approved', action: 'withdraw', to: 'withdrawn', by: ['owner', 'admin'] },
  // An admin can pull a live listing back for re-review without destroying it.
  { from: 'approved', action: 'revoke', to: 'pending', by: ['admin'], requiresReason: true },

  { from: 'sold', action: 'relist', to: 'approved', by: ['owner', 'admin'] },
  { from: 'rented', action: 'relist', to: 'approved', by: ['owner', 'admin'] },
];

export function findTransition(
  from: PropertyStatus,
  action: PropertyAction,
): StatusTransition | undefined {
  return PROPERTY_TRANSITIONS.find(
    (transition) => transition.from === from && transition.action === action,
  );
}

/** The actions this actor may take right now — the source of the buttons in the UI. */
export function allowedActions(
  from: PropertyStatus,
  actor: TransitionActor,
): readonly PropertyAction[] {
  return PROPERTY_TRANSITIONS.filter(
    (transition) => transition.from === from && transition.by.includes(actor),
  ).map((transition) => transition.action);
}

/**
 * Which fields may still be edited.
 *
 * Once a listing is live the description and the asking price stay editable — prices move,
 * and forcing a fresh review for a price cut would just push brokers to delete and repost.
 * Everything that was reviewed (area, government record, location, documents) is frozen.
 */
export const POST_APPROVAL_EDITABLE = [
  'title',
  'description',
  'pricePaise',
  'priceUnit',
  'contact',
  'images',
] as const;

export const FREELY_EDITABLE_STATUSES: readonly PropertyStatus[] = [
  'draft',
  'pending',
  'rejected',
  'withdrawn',
];

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{2,60}$/, 'Not a valid reference value');

/**
 * Gujarat's bounding box, generously rounded. A pin outside it is a mistake — a mis-typed
 * coordinate or a map centred on the wrong country — not a listing we can carry.
 */
export const GUJARAT_BOUNDS = { minLat: 20.0, maxLat: 24.8, minLng: 68.0, maxLng: 74.6 };

export const latitudeSchema = z
  .number()
  .min(GUJARAT_BOUNDS.minLat, 'That point is outside Gujarat')
  .max(GUJARAT_BOUNDS.maxLat, 'That point is outside Gujarat');
export const longitudeSchema = z
  .number()
  .min(GUJARAT_BOUNDS.minLng, 'That point is outside Gujarat')
  .max(GUJARAT_BOUNDS.maxLng, 'That point is outside Gujarat');

/** The government record, exactly as it is written on the 7/12 extract. */
export const govDetailsSchema = z
  .object({
    khaataNumber: z.string().trim().max(50).optional(),
    surveyNumber: z.string().trim().max(50).optional(),
    /** Free text on purpose: "૦-૬૪-૭૫" in હે.આરે.ચો.મી. is not a number we may reformat. */
    areaText: z.string().trim().max(60).optional(),
  })
  .strict();

export const propertyLocationSchema = z
  .object({
    district: slugSchema,
    taluka: slugSchema,
    village: slugSchema.optional(),
    pincode: pincodeSchema,
    address: z.string().trim().max(300).optional(),
    lat: latitudeSchema.optional(),
    lng: longitudeSchema.optional(),
    precision: locationPrecisionSchema,
    source: locationSourceSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.precision === 'exact' && (value.lat == null || value.lng == null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lat'],
        message: 'Drop a pin on the map, or mark the location as approximate',
      });
    }
    if (value.precision === 'exact' && value.source !== 'pin') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['source'],
        message: 'An exact location must come from a dropped pin',
      });
    }
  });

export const areaInputSchema = z
  .object({
    value: z.number().positive('Enter the area').max(10_000_000),
    unit: z.enum(AREA_UNITS),
  })
  .strict();

export const propertyContactSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: emailSchema,
    phone: phoneSchema,
    whatsapp: phoneSchema.optional(),
  })
  .strict();

export const propertyImageSchema = z
  .object({
    url: z.string().url().max(500),
    alt: z.string().trim().max(120).default(''),
    isPrimary: z.boolean().default(false),
  })
  .strict();

/** ₹1,000 crore. Anything above this is a typo, and paise overflow nothing below it. */
export const MAX_PRICE_PAISE = 1_000_00_00_000_00;

export const createPropertySchema = z
  .object({
    title: z.string().trim().min(8, 'Give the listing a descriptive title').max(100),
    description: z.string().trim().max(2000).optional(),
    propertyType: propertyTypeSchema,
    listingType: listingTypeSchema,
    insertedBy: insertedBySchema.default('broker'),

    pricePaise: z.number().int().positive('Enter the asking price').max(MAX_PRICE_PAISE),
    priceUnit: priceUnitSchema.default('total'),

    area: areaInputSchema,
    govDetails: govDetailsSchema.optional(),
    location: propertyLocationSchema,

    amenities: z.array(slugSchema).max(40).default([]),
    disadvantages: z.array(slugSchema).max(40).default([]),

    contact: propertyContactSchema,
    images: z.array(propertyImageSchema).max(20).default([]),
  })
  .strict();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

/** Every field optional, but no unknown ones — a typo must not silently do nothing. */
export const updatePropertySchema = createPropertySchema.partial().strict();
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export const statusChangeSchema = z
  .object({
    action: propertyActionSchema,
    reason: z.string().trim().min(5).max(500).optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export const PROPERTY_SORTS = ['newest', 'price-asc', 'price-desc', 'area-desc'] as const;
export const propertySortSchema = z.enum(PROPERTY_SORTS);
export type PropertySort = z.infer<typeof propertySortSchema>;

export const SEARCH_PAGE_SIZE = 24;
export const SEARCH_MAX_PAGE_SIZE = 60;

/** Values arrive as query strings, so every number and list is coerced here. */
export const propertySearchSchema = z
  .object({
    district: slugSchema.optional(),
    taluka: slugSchema.optional(),
    village: slugSchema.optional(),
    pincode: pincodeSchema.optional(),

    propertyType: propertyTypeSchema.optional(),
    listingType: listingTypeSchema.optional(),

    priceMinPaise: z.coerce.number().int().nonnegative().max(MAX_PRICE_PAISE).optional(),
    priceMaxPaise: z.coerce.number().int().nonnegative().max(MAX_PRICE_PAISE).optional(),

    areaMin: z.coerce.number().positive().optional(),
    areaMax: z.coerce.number().positive().optional(),
    areaUnit: z.enum(AREA_UNITS).default('vigha'),

    amenities: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform(toSlugList),

    q: z.string().trim().min(2).max(80).optional(),

    /** A radius search around a point, in kilometres. */
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    radiusKm: z.coerce.number().positive().max(200).default(25),

    sort: propertySortSchema.default('newest'),
    cursor: z.string().max(200).optional(),
    limit: z.coerce.number().int().positive().max(SEARCH_MAX_PAGE_SIZE).default(SEARCH_PAGE_SIZE),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.priceMinPaise != null &&
      value.priceMaxPaise != null &&
      value.priceMinPaise > value.priceMaxPaise
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['priceMinPaise'],
        message: 'The lowest price cannot be above the highest',
      });
    }
    if ((value.lat == null) !== (value.lng == null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lat'],
        message: 'A radius search needs both a latitude and a longitude',
      });
    }
  });

export type PropertySearchInput = z.infer<typeof propertySearchSchema>;

function toSlugList(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  const parts = Array.isArray(value) ? value : value.split(',');
  return parts.map((part) => part.trim().toLowerCase()).filter((part) => part.length > 0);
}

/** Area filters are typed in one unit and compared in the canonical one. */
export const areaFilterSqft = (value: number | undefined, unit: AreaUnit): number | undefined =>
  value == null ? undefined : toSqft(value, unit);
