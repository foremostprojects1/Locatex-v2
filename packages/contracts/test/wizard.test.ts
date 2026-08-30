import { describe, expect, it } from 'vitest';
import {
  WIZARD_STEPS,
  completedSteps,
  isDraftComplete,
  propertyDraftDataSchema,
  validateStep,
} from '../src/wizard.js';
import { createPropertySchema } from '../src/property.js';

const full = {
  title: 'Fertile farmland near Morbi',
  description: 'Level land on the Sanala road.',
  propertyType: 'land',
  listingType: 'rent',
  pricePaise: 72_00_000_00,
  priceUnit: 'total',
  area: { value: 4, unit: 'vigha' },
  location: {
    district: 'morbi',
    taluka: 'morbi',
    pincode: '363641',
    precision: 'approx',
    source: 'pincode',
  },
  amenities: ['fencing'],
  disadvantages: [],
  contact: { name: 'Ramesh Patel', email: 'ramesh@example.com', phone: '9876543210' },
  images: [],
};

describe('validating one step at a time', () => {
  it('judges a step against the whole form without tripping over the other steps', () => {
    for (const step of WIZARD_STEPS) {
      expect(validateStep(step.id, full), `${step.id} should pass`).toEqual([]);
    }
  });

  it('reports the field a form can actually highlight', () => {
    const issues = validateStep('contact', {
      ...full,
      contact: { name: 'R', email: 'not-an-email', phone: '12345' },
    });

    const fields = issues.map((issue) => issue.field);
    expect(fields).toContain('contact.email');
    expect(fields).toContain('contact.phone');
  });

  it('uses the same rule the final submit will use', () => {
    const broken = { ...full, title: 'Land' }; // under the eight-character minimum
    expect(validateStep('basics', broken).length).toBeGreaterThan(0);
    expect(createPropertySchema.safeParse(broken).success).toBe(false);
  });

  it('will not call a location step finished when the pin is missing', () => {
    const issues = validateStep('location', {
      ...full,
      location: { ...full.location, precision: 'exact', source: 'pin' },
    });
    expect(issues.map((issue) => issue.field)).toContain('location.lat');
  });
});

describe('a half-finished draft', () => {
  it('accepts what the broker has typed so far', () => {
    const parsed = propertyDraftDataSchema.parse({
      title: 'Farmland near',
      location: { district: 'morbi', precision: 'exact' },
    });
    expect(parsed.location?.district).toBe('morbi');
  });

  it('still refuses a value of the wrong shape', () => {
    expect(propertyDraftDataSchema.safeParse({ pricePaise: -5 }).success).toBe(false);
    expect(propertyDraftDataSchema.safeParse({ title: 'x'.repeat(200) }).success).toBe(false);
    expect(propertyDraftDataSchema.safeParse({ nonsense: true }).success).toBe(false);
  });

  it('tracks which steps are done, so the rail is never a guess', () => {
    const partial = { title: full.title, propertyType: 'land', listingType: 'rent' };
    const progress = completedSteps(partial);

    expect(progress.basics).toBe(true);
    expect(progress.location).toBe(false);
    expect(progress.details).toBe(false);
    expect(isDraftComplete(partial)).toBe(false);
    expect(isDraftComplete(full)).toBe(true);
  });

  it('treats photos and features as genuinely optional', () => {
    expect(completedSteps({}).features).toBe(true);
  });
});
