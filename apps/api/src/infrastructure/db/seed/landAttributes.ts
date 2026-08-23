/**
 * The vocabulary a plot of land is described with.
 *
 * The first nine are exactly what the v1 form offered, `legacyValue` recording the string
 * v1 stored so migrated listings keep their meaning. The rest are the additions the client
 * approved: road access, water source, soil type, fencing type, distance from highway and
 * electricity connection type.
 *
 * Seeded, not hard-coded, so an admin can add "drip irrigation" without a deployment.
 */
export interface LandAttributeSeed {
  slug: string;
  kind: 'amenity' | 'disadvantage';
  label: string;
  group: string;
  order: number;
  legacyValue?: string;
}

export const LAND_ATTRIBUTES: LandAttributeSeed[] = [
  // ---- v1 amenities, unchanged ------------------------------------------------
  { slug: 'fencing', kind: 'amenity', label: 'Fencing / boundary wall', group: 'structure', order: 10, legacyValue: 'fencing' },
  { slug: 'house-on-land', kind: 'amenity', label: 'House on land', group: 'structure', order: 20, legacyValue: 'house' },
  { slug: 'electricity', kind: 'amenity', label: 'Electricity connection', group: 'utilities', order: 30, legacyValue: 'electricity' },
  { slug: 'kuvo', kind: 'amenity', label: 'Kuvo (open well)', group: 'water', order: 40, legacyValue: 'kuvo' },
  { slug: 'underground-pipeline', kind: 'amenity', label: 'Underground pipeline', group: 'water', order: 50, legacyValue: 'underground_pipeline' },

  // ---- v1 disadvantages, unchanged --------------------------------------------
  { slug: 'underground-cable', kind: 'disadvantage', label: 'Underground cable / line', group: 'risk', order: 10, legacyValue: 'Underground Cable / Line' },
  { slug: 'borewell-well', kind: 'disadvantage', label: 'Borewell / well', group: 'risk', order: 20, legacyValue: 'Borewell / Well' },
  { slug: 'passing-vijpool', kind: 'disadvantage', label: 'Passing vijpool (power pylon)', group: 'risk', order: 30, legacyValue: 'Passing Vijpool' },
  { slug: 'passing-canal', kind: 'disadvantage', label: 'Passing canal', group: 'risk', order: 40, legacyValue: 'Passing Canal' },

  // ---- approved additions ------------------------------------------------------
  { slug: 'road-kaccha', kind: 'amenity', label: 'Kaccha road access', group: 'access', order: 60 },
  { slug: 'road-pakka', kind: 'amenity', label: 'Pakka road access', group: 'access', order: 70 },
  { slug: 'road-highway', kind: 'amenity', label: 'Highway touch', group: 'access', order: 80 },
  { slug: 'water-canal', kind: 'amenity', label: 'Canal water', group: 'water', order: 90 },
  { slug: 'water-borewell', kind: 'amenity', label: 'Borewell', group: 'water', order: 100 },
  { slug: 'water-none', kind: 'amenity', label: 'No water source', group: 'water', order: 110 },
  { slug: 'soil-black', kind: 'amenity', label: 'Black soil', group: 'soil', order: 120 },
  { slug: 'soil-sandy', kind: 'amenity', label: 'Sandy soil', group: 'soil', order: 130 },
  { slug: 'soil-loamy', kind: 'amenity', label: 'Loamy soil', group: 'soil', order: 140 },
  { slug: 'fencing-barbed', kind: 'amenity', label: 'Barbed wire fencing', group: 'structure', order: 150 },
  { slug: 'fencing-wall', kind: 'amenity', label: 'Compound wall', group: 'structure', order: 160 },
  { slug: 'electricity-agricultural', kind: 'amenity', label: 'Agricultural power connection', group: 'utilities', order: 170 },
  { slug: 'electricity-domestic', kind: 'amenity', label: 'Domestic power connection', group: 'utilities', order: 180 },
  { slug: 'drip-irrigation', kind: 'amenity', label: 'Drip irrigation installed', group: 'water', order: 190 },
];

/**
 * "Distance from highway" is a number, not a checkbox, so it belongs on the property
 * itself rather than in this list. Recorded here so the intent is not lost.
 */
export const NUMERIC_LAND_FIELDS = ['distanceFromHighwayKm', 'roadFrontageFeet'] as const;
