import { z } from 'zod';
import {
  createPropertySchema,
  propertyLocationSchema,
  propertyTypeSchema,
  listingTypeSchema,
  insertedBySchema,
  priceUnitSchema,
  propertyImageSchema,
  MAX_PRICE_PAISE,
} from './property.js';
import { AREA_UNITS } from './area.js';
import { locationPrecisionSchema, locationSourceSchema, pincodeSchema } from './location.js';
import { emailSchema, phoneSchema } from './auth.js';

/**
 * The five steps a broker fills in, and the half-finished thing that exists between them.
 *
 * Each step's schema is a slice of `createPropertySchema` rather than a copy of it, so the
 * message a broker sees while typing is produced by the same rule that will accept or
 * refuse the listing at the end. There is no second definition to drift.
 */

export const WIZARD_STEPS = [
  { id: 'basics', title: 'The basics', hint: 'What are you listing, and how?' },
  { id: 'location', title: 'Where it is', hint: 'District, village and the point on the map' },
  { id: 'details', title: 'Size and price', hint: 'Area, asking price and the 7/12 record' },
  { id: 'features', title: 'Features and photos', hint: 'What the land has, and what it does not' },
  { id: 'contact', title: 'Who to contact', hint: 'The number a buyer will ring' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];
export const WIZARD_STEP_IDS = WIZARD_STEPS.map((step) => step.id) as readonly WizardStepId[];

/**
 * Validation for one step, taken straight from the schema that governs the whole listing.
 *
 * `.strip()` matters: a step is validated against the *whole* form state, so it has to
 * ignore the keys belonging to the other four steps. The strict gates are elsewhere —
 * `propertyDraftDataSchema` on every autosave and `createPropertySchema` at submit — so an
 * invented field is still refused, just not by the step that happens to be on screen.
 */
export const wizardStepSchemas = {
  basics: createPropertySchema.pick({
    title: true,
    description: true,
    propertyType: true,
    listingType: true,
    insertedBy: true,
  }).strip(),
  location: z.object({ location: propertyLocationSchema }),
  details: createPropertySchema.pick({
    pricePaise: true,
    priceUnit: true,
    area: true,
    govDetails: true,
  }).strip(),
  features: createPropertySchema.pick({
    amenities: true,
    disadvantages: true,
    images: true,
  }).strip(),
  contact: createPropertySchema.pick({ contact: true }).strip(),
} as const;

export interface StepIssue {
  field: string;
  message: string;
}

/**
 * Validates one step and returns the problems as flat field paths, which is what a form
 * needs — `location.pincode` rather than a nested tree it has to walk.
 */
export function validateStep(step: WizardStepId, data: unknown): StepIssue[] {
  const result = wizardStepSchemas[step].safeParse(data);
  if (result.success) return [];
  return result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

// ---------------------------------------------------------------------------
// The draft
// ---------------------------------------------------------------------------

/**
 * A half-filled form.
 *
 * Everything is optional and the cross-field rules are dropped, because a draft saved
 * halfway through step two legitimately has a precision but no pin yet. Nothing here is
 * loose, though: a value that is present still has to be the right shape, so an autosave
 * cannot smuggle a 40 MB string or a negative price into the database and only be caught
 * weeks later at submit time.
 */
const draftLocationSchema = z
  .object({
    district: z.string().trim().max(60).optional(),
    taluka: z.string().trim().max(60).optional(),
    village: z.string().trim().max(60).optional(),
    pincode: pincodeSchema.optional(),
    address: z.string().trim().max(300).optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    precision: locationPrecisionSchema.optional(),
    source: locationSourceSchema.optional(),
  })
  .strict();

const draftContactSchema = z
  .object({
    name: z.string().trim().max(80).optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    whatsapp: phoneSchema.optional(),
  })
  .strict();

export const propertyDraftDataSchema = z
  .object({
    title: z.string().trim().max(100).optional(),
    description: z.string().trim().max(2000).optional(),
    propertyType: propertyTypeSchema.optional(),
    listingType: listingTypeSchema.optional(),
    insertedBy: insertedBySchema.optional(),

    pricePaise: z.number().int().nonnegative().max(MAX_PRICE_PAISE).optional(),
    priceUnit: priceUnitSchema.optional(),

    area: z
      .object({
        value: z.number().nonnegative().max(10_000_000).optional(),
        unit: z.enum(AREA_UNITS).optional(),
      })
      .strict()
      .optional(),

    govDetails: z
      .object({
        khaataNumber: z.string().trim().max(50).optional(),
        surveyNumber: z.string().trim().max(50).optional(),
        areaText: z.string().trim().max(60).optional(),
      })
      .strict()
      .optional(),

    location: draftLocationSchema.optional(),
    amenities: z.array(z.string().trim().max(60)).max(40).optional(),
    disadvantages: z.array(z.string().trim().max(60)).max(40).optional(),
    contact: draftContactSchema.optional(),
    images: z.array(propertyImageSchema).max(20).optional(),
  })
  .strict();

export type PropertyDraftData = z.infer<typeof propertyDraftDataSchema>;

export const draftSaveSchema = z
  .object({
    step: z.enum(WIZARD_STEP_IDS as [WizardStepId, ...WizardStepId[]]).optional(),
    data: propertyDraftDataSchema,
  })
  .strict();

/**
 * Which steps are finished. The wizard uses it for the progress rail and to decide whether
 * "Submit for review" may be offered at all; the server runs the same function before it
 * turns a draft into a listing.
 */
export function completedSteps(data: PropertyDraftData): Record<WizardStepId, boolean> {
  return {
    basics: validateStep('basics', data).length === 0,
    location: validateStep('location', data).length === 0,
    details: validateStep('details', data).length === 0,
    features: validateStep('features', data).length === 0,
    contact: validateStep('contact', data).length === 0,
  };
}

export const isDraftComplete = (data: PropertyDraftData): boolean =>
  Object.values(completedSteps(data)).every(Boolean);
