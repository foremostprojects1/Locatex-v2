import { Schema, model } from 'mongoose';

/**
 * Gujarat's administrative hierarchy and the vocabulary a listing is described with.
 * Reference data is read on nearly every page and changes a few times a year, so it lives
 * in its own collections, is seeded from a committed file, and is served with an ETag.
 */

const districtSchema = new Schema(
  {
    _id: { type: String }, // slug
    name: { type: String, required: true },
    talukaCount: { type: Number, default: 0 },
  },
  { strict: 'throw', versionKey: false, collection: 'ref_districts', timestamps: true },
);

const talukaSchema = new Schema(
  {
    _id: { type: String }, // districtSlug/talukaSlug
    slug: { type: String, required: true },
    name: { type: String, required: true },
    districtSlug: { type: String, required: true, index: true },
  },
  { strict: 'throw', versionKey: false, collection: 'ref_talukas', timestamps: true },
);

const villageSchema = new Schema(
  {
    _id: { type: String }, // districtSlug/talukaSlug/villageSlug/pincode
    slug: { type: String, required: true },
    name: { type: String, required: true },
    districtSlug: { type: String, required: true, index: true },
    talukaSlug: { type: String, required: true, index: true },
    pincode: { type: String, required: true, index: true },
  },
  { strict: 'throw', versionKey: false, collection: 'ref_villages', timestamps: true },
);
villageSchema.index({ name: 'text' });
villageSchema.index({ districtSlug: 1, talukaSlug: 1, slug: 1 });

/**
 * One document per pincode, holding whatever we currently know about where it is.
 *
 * `hint` is the provisional GeoNames point — kept because it is a useful starting guess and
 * useless as a published pin. `centroid` is only filled once a geocoder has resolved it,
 * and carries the radius that came with it, so the circle drawn on the map is a measured
 * extent rather than a guess.
 */
const pincodeSchema = new Schema(
  {
    _id: { type: String }, // the pincode itself
    districtSlug: { type: String, required: true, index: true },
    talukaSlug: { type: String, required: true },
    placeCount: { type: Number, default: 0 },

    hint: {
      lat: { type: Number },
      lng: { type: Number },
      agreement: { type: Number },
    },

    centroid: {
      lat: { type: Number },
      lng: { type: Number },
    },
    radiusMetres: { type: Number, default: null },
    source: {
      type: String,
      enum: ['nominatim', 'google', 'manual', null],
      default: null,
    },
    resolvedAt: { type: Date, default: null },
    /** Set when a lookup failed, so we do not hammer a geocoder that has no answer. */
    lastAttemptAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
  },
  { strict: 'throw', versionKey: false, collection: 'ref_pincodes', timestamps: true },
);

/** Amenities and disadvantages, editable by an admin without a deployment. */
const landAttributeSchema = new Schema(
  {
    _id: { type: String }, // slug
    kind: { type: String, enum: ['amenity', 'disadvantage'], required: true, index: true },
    label: { type: String, required: true },
    /** Grouped in the form: utilities, water, access, structure, risk. */
    group: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    /** Carried over from v1 so existing listings keep their meaning. */
    legacyValue: { type: String, default: null },
  },
  { strict: 'throw', versionKey: false, collection: 'ref_land_attributes', timestamps: true },
);

export const DistrictModel = model('District', districtSchema);
export const TalukaModel = model('Taluka', talukaSchema);
export const VillageModel = model('Village', villageSchema);
export const PincodeModel = model('Pincode', pincodeSchema);
export const LandAttributeModel = model('LandAttribute', landAttributeSchema);
