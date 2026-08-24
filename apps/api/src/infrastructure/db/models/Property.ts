import { Schema, model } from 'mongoose';
import { ulid } from 'ulid';
import {
  AREA_UNITS,
  INSERTED_BY,
  LISTING_TYPES,
  LOCATION_PRECISIONS,
  LOCATION_SOURCES,
  PRICE_UNITS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from '@locatex/contracts';

/**
 * A listing. One document holds everything a search needs, because a land search filters on
 * district, price, area and type at once and splitting those across collections would mean
 * a join Mongo cannot do cheaply.
 *
 * Two fields exist purely so the database can answer questions the broker's input cannot:
 * `areaSqft` is the canonical area (listings are typed in five different units and must
 * still sort against each other), and `geo` is a GeoJSON point for the `2dsphere` radius
 * query. Both are derived on save — never accepted from a client.
 */

const govDetailsSchema = new Schema(
  {
    khaataNumber: { type: String, trim: true },
    surveyNumber: { type: String, trim: true },
    /** Kept as the broker typed it: "૦-૬૪-૭૫" is a record, not a measurement to convert. */
    areaText: { type: String, trim: true },
  },
  { _id: false },
);

const locationSchema = new Schema(
  {
    district: { type: String, required: true },
    taluka: { type: String, required: true },
    village: { type: String, default: null },
    pincode: { type: String, required: true },
    address: { type: String, trim: true, default: null },

    lat: { type: Number, default: null },
    lng: { type: Number, default: null },

    precision: { type: String, enum: LOCATION_PRECISIONS, required: true },
    source: { type: String, enum: LOCATION_SOURCES, required: true },
    /** The circle drawn when the pin is not exact; measured, not guessed — see Phase 3. */
    radiusMetres: { type: Number, default: null },
  },
  { _id: false },
);

const contactSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true },
    phone: { type: String, trim: true, required: true },
    whatsapp: { type: String, trim: true, default: null },
  },
  { _id: false },
);

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

/** One row per move through the lifecycle. Append-only; nothing here is ever rewritten. */
const statusEventSchema = new Schema(
  {
    from: { type: String, enum: PROPERTY_STATUSES, required: true },
    to: { type: String, enum: PROPERTY_STATUSES, required: true },
    action: { type: String, required: true },
    byUserId: { type: String, required: true },
    byRole: { type: String, required: true },
    reason: { type: String, trim: true, default: null },
    at: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

const propertySchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },

    brokerId: { type: String, required: true, index: true },
    insertedBy: { type: String, enum: INSERTED_BY, required: true, default: 'broker' },

    title: { type: String, trim: true, required: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 2000, default: null },

    propertyType: { type: String, enum: PROPERTY_TYPES, required: true },
    listingType: { type: String, enum: LISTING_TYPES, required: true },

    /** Money is an integer number of paise everywhere in the system. */
    pricePaise: { type: Number, required: true, min: 0 },
    priceUnit: { type: String, enum: PRICE_UNITS, required: true, default: 'total' },

    areaValue: { type: Number, required: true, min: 0 },
    areaUnit: { type: String, enum: AREA_UNITS, required: true },
    /** Canonical, derived. The only area field a query is allowed to touch. */
    areaSqft: { type: Number, required: true, min: 0, index: true },

    govDetails: { type: govDetailsSchema, default: () => ({}) },
    location: { type: locationSchema, required: true },

    /**
     * GeoJSON, `[lng, lat]` — the order GeoJSON mandates and the opposite of how everyone
     * says it aloud, which is why it is derived in one place instead of at each call site.
     */
    geo: {
      type: { type: String, enum: ['Point'], default: undefined },
      coordinates: { type: [Number], default: undefined },
    },

    amenities: { type: [String], default: [] },
    disadvantages: { type: [String], default: [] },

    contact: { type: contactSchema, required: true },
    images: { type: [imageSchema], default: [] },

    status: {
      type: String,
      enum: PROPERTY_STATUSES,
      required: true,
      default: 'draft',
      index: true,
    },
    statusHistory: { type: [statusEventSchema], default: [] },
    rejectionReason: { type: String, trim: true, default: null },

    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: null },
    /** When it first became publicly visible; unchanged by later edits. */
    publishedAt: { type: Date, default: null },

    isFeatured: { type: Boolean, default: false },
    viewsCount: { type: Number, default: 0 },

    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    strict: 'throw',
    versionKey: false,
    collection: 'properties',
  },
);

// The shape of a browse request: a status filter, a place, and a sort. The compound index
// leads with `status` because every public query pins it to a single value.
propertySchema.index({ status: 1, 'location.district': 1, _id: -1 });
propertySchema.index({ status: 1, 'location.district': 1, 'location.taluka': 1, _id: -1 });
propertySchema.index({ status: 1, propertyType: 1, listingType: 1, _id: -1 });
propertySchema.index({ status: 1, pricePaise: 1, _id: 1 });
propertySchema.index({ status: 1, areaSqft: -1, _id: -1 });
propertySchema.index({ brokerId: 1, status: 1, _id: -1 });
propertySchema.index({ status: 1, isFeatured: -1, _id: -1 });
propertySchema.index({ 'location.pincode': 1 });

// Radius search. Sparse, because a listing with no coordinates at all is legitimate — the
// broker may know only the pincode, and Phase 3 resolves that lazily.
propertySchema.index({ geo: '2dsphere' }, { sparse: true });

// Free-text over the fields a person actually types into a search box.
propertySchema.index(
  { title: 'text', description: 'text', 'location.address': 'text' },
  { weights: { title: 10, 'location.address': 4, description: 1 }, name: 'property_text' },
);

export const PropertyModel = model('Property', propertySchema);
export type PropertyDoc = InstanceType<typeof PropertyModel>;
