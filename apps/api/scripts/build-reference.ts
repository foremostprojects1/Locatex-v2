/**
 * Turns the GeoNames postal export into the Gujarat reference data the app ships with.
 *
 *   pnpm --filter @locatex/api reference:build path/to/IN.txt
 *
 * Run rarely — the output is committed, so a deployment never depends on GeoNames being
 * reachable, and the data cannot change under us between environments.
 *
 * Source: https://download.geonames.org/export/zip/IN.zip — CC BY 4.0, attribution is in
 * the app footer and in docs/attribution.md.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * The 34 districts as the client lists them in the v1 form — which is current, including
 * the 2013 splits and Vav-Tharad (2024). GeoNames still reports only 27 for Gujarat, so
 * this list is authoritative and GeoNames is mapped onto it.
 */
const DISTRICTS = [
  'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar',
  'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 'Gandhinagar',
  'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana',
  'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot',
  'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad', 'Vav-Tharad',
] as const;

/** GeoNames spells several districts differently, or in capitals. */
const DISTRICT_ALIASES: Record<string, string> = {
  kachchh: 'Kutch',
  kutchh: 'Kutch',
  'gandhi nagar': 'Gandhinagar',
  'surendra nagar': 'Surendranagar',
  'panch mahals': 'Panchmahal',
  'the dangs': 'Dang',
  mahesana: 'Mehsana',
  morbi: 'Morbi',
};

/**
 * Districts created after the GeoNames snapshot still carry their parent's name there, so
 * their talukas are reassigned by name.
 *
 * ⚠ Curated by hand from the district formation notifications, not from a machine-readable
 * source. Worth a check by someone who knows the ground before launch — a wrong taluka
 * here puts a listing in the wrong district's search results.
 */
const TALUKA_DISTRICT_OVERRIDES: Record<string, string> = {
  // Morbi, carved out of Rajkot and Surendranagar in 2013
  morbi: 'Morbi', maliya: 'Morbi', tankara: 'Morbi', wankaner: 'Morbi', halvad: 'Morbi',
  // Botad, from Bhavnagar and Ahmedabad
  botad: 'Botad', gadhada: 'Botad', barwala: 'Botad', ranpur: 'Botad',
  // Devbhoomi Dwarka, from Jamnagar
  'okha mandal': 'Devbhoomi Dwarka', khambhalia: 'Devbhoomi Dwarka',
  bhanvad: 'Devbhoomi Dwarka', kalyanpur: 'Devbhoomi Dwarka', dwarka: 'Devbhoomi Dwarka',
  // Gir Somnath, from Junagadh
  veraval: 'Gir Somnath', talala: 'Gir Somnath', sutrapada: 'Gir Somnath',
  kodinar: 'Gir Somnath', una: 'Gir Somnath', 'gir gadhada': 'Gir Somnath',
  // Mahisagar, from Panchmahal and Kheda
  lunawada: 'Mahisagar', santrampur: 'Mahisagar', kadana: 'Mahisagar',
  khanpur: 'Mahisagar', balasinor: 'Mahisagar', virpur: 'Mahisagar',
  // Chhota Udaipur, from Vadodara
  'chhota udaipur': 'Chhota Udaipur', 'jetpur pavi': 'Chhota Udaipur',
  kavant: 'Chhota Udaipur', naswadi: 'Chhota Udaipur', sankheda: 'Chhota Udaipur',
  bodeli: 'Chhota Udaipur',
  // Aravalli, from Sabarkantha
  modasa: 'Aravalli', bayad: 'Aravalli', dhansura: 'Aravalli', malpur: 'Aravalli',
  meghraj: 'Aravalli', bhiloda: 'Aravalli',
  // Vav-Tharad, from Banaskantha (2024)
  vav: 'Vav-Tharad', tharad: 'Vav-Tharad', bhabhar: 'Vav-Tharad',
  dhanera: 'Vav-Tharad', deesa: 'Banaskantha', suigam: 'Vav-Tharad',
  lakhani: 'Vav-Tharad', deodar: 'Vav-Tharad', kankrej: 'Vav-Tharad',
};

const titleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const slugify = (value: string): string =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

interface Place {
  pincode: string;
  name: string;
  slug: string;
  districtSlug: string;
  talukaSlug: string;
  lat: number;
  lng: number;
}

function main(): void {
  const source = process.argv[2];
  if (!source) {
    console.error('usage: reference:build <path to GeoNames IN.txt>');
    process.exit(1);
  }

  const districtBySlug = new Map(DISTRICTS.map((name) => [slugify(name), name]));
  const talukas = new Map<string, { name: string; slug: string; districtSlug: string }>();
  const places: Place[] = [];
  const unmatched = new Set<string>();

  for (const line of fs.readFileSync(source, 'utf8').split('\n')) {
    const columns = line.split('\t');
    if (columns.length < 11 || columns[3] !== 'Gujarat') continue;

    const [, pincode, placeName, , , rawDistrict, , rawTaluka, , lat, lng] = columns;
    if (!pincode || !placeName || !rawDistrict || !rawTaluka || !lat || !lng) continue;

    const talukaName = titleCase(rawTaluka.trim());
    const talukaSlug = slugify(talukaName);

    // A newer district wins over whatever GeoNames still records as the parent.
    const overridden = TALUKA_DISTRICT_OVERRIDES[talukaSlug];
    const districtName =
      overridden ??
      DISTRICT_ALIASES[rawDistrict.trim().toLowerCase()] ??
      districtBySlug.get(slugify(rawDistrict)) ??
      titleCase(rawDistrict.trim());

    const districtSlug = slugify(districtName);
    if (!districtBySlug.has(districtSlug)) {
      unmatched.add(`${rawDistrict} → ${districtName}`);
      continue;
    }

    talukas.set(`${districtSlug}/${talukaSlug}`, {
      name: talukaName,
      slug: talukaSlug,
      districtSlug,
    });

    places.push({
      pincode,
      name: titleCase(placeName.trim()),
      slug: slugify(placeName),
      districtSlug,
      talukaSlug,
      lat: Number(lat),
      lng: Number(lng),
    });
  }

  /**
   * Pincode coordinates, treated with suspicion on purpose.
   *
   * GeoNames states in its own readme that these are derived by an algorithm, and where no
   * match was found it averages neighbouring postal codes. It shows: 1,343 Gujarat rows
   * carry the lowest accuracy flag, 608 of 1,026 pincodes give every village the same
   * point, and the mean of 363641 lands ~90 km from Morbi town.
   *
   * So the seed keeps the *modal* coordinate as a provisional hint and no radius at all. A
   * real centroid and radius are fetched from a geocoder at runtime and cached — see
   * `pincodeLocation.ts`. Shipping a computed radius here would draw a confident circle
   * around a number we do not trust.
   */
  const byPincode = new Map<string, Place[]>();
  for (const place of places) {
    const list = byPincode.get(place.pincode) ?? [];
    list.push(place);
    byPincode.set(place.pincode, list);
  }

  const pincodes = [...byPincode.entries()].map(([pincode, members]) => {
    // The point most of the villages share, rather than an average that one bad row can drag
    // across the state.
    const tally = new Map<string, { lat: number; lng: number; count: number }>();
    for (const member of members) {
      const key = `${member.lat},${member.lng}`;
      const entry = tally.get(key) ?? { lat: member.lat, lng: member.lng, count: 0 };
      entry.count += 1;
      tally.set(key, entry);
    }
    const modal = [...tally.values()].sort((a, b) => b.count - a.count)[0]!;
    const first = members[0]!;

    return {
      pincode,
      districtSlug: first.districtSlug,
      talukaSlug: first.talukaSlug,
      placeCount: members.length,
      /** Provisional: a hint for the geocoder, never published as a pin on its own. */
      hint: { lat: round(modal.lat), lng: round(modal.lng), agreement: modal.count / members.length },
    };
  });

  const output = {
    source: 'GeoNames postal export (CC BY 4.0) + curated district list',
    generatedAt: new Date().toISOString().slice(0, 10),
    districts: DISTRICTS.map((name) => ({ name, slug: slugify(name) })),
    talukas: [...talukas.values()].sort((a, b) => a.slug.localeCompare(b.slug)),
    // Village coordinates are omitted for the same reason as the pincode radius: most are
    // repeats of one point per pincode. Names, parentage and pincode are what the cascade
    // and the search need, and those are reliable.
    villages: places
      .map(({ name, slug, districtSlug, talukaSlug, pincode }) => ({
        name,
        slug,
        districtSlug,
        talukaSlug,
        pincode,
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug)),
    pincodes: pincodes.sort((a, b) => a.pincode.localeCompare(b.pincode)),
  };

  const target = path.resolve(import.meta.dirname, '../src/infrastructure/db/seed/gujarat.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(output)}\n`);

  console.warn(
    `districts ${output.districts.length} · talukas ${output.talukas.length} · ` +
      `villages ${output.villages.length} · pincodes ${output.pincodes.length}`,
  );
  if (unmatched.size > 0) {
    console.warn(`unmatched districts skipped: ${[...unmatched].join(', ')}`);
  }
  const districtsWithoutTalukas = output.districts.filter(
    (district) => !output.talukas.some((taluka) => taluka.districtSlug === district.slug),
  );
  if (districtsWithoutTalukas.length > 0) {
    console.warn(
      `no talukas mapped for: ${districtsWithoutTalukas.map((d) => d.name).join(', ')}`,
    );
  }
}

const round = (value: number): number => Math.round(value * 10_000) / 10_000;

main();
