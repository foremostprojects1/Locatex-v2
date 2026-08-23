# Data attribution

## GeoNames postal codes

The Gujarat district → taluka → village hierarchy and pincode membership in
`apps/api/src/infrastructure/db/seed/gujarat.json` are derived from the
[GeoNames postal code export](https://download.geonames.org/export/zip/), used under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

A link to <https://www.geonames.org> belongs in the site footer before launch.

**What we use it for, and what we do not.** The hierarchy and names are reliable and are
used directly. The coordinates are not: GeoNames' own readme says they are derived by an
algorithm and, where no match was found, averaged from neighbouring postal codes. In the
Gujarat extract 1,343 rows carry the lowest accuracy flag and 608 of 1,026 pincodes give
every village the same point — for 363641 that point sits about 90 km from Morbi town. So
the seed keeps the modal coordinate only as a hint, and a real centroid with a measured
radius is resolved from a geocoder at runtime and cached.

## OpenStreetMap / Nominatim

Pincode centroids and their bounding boxes come from
[Nominatim](https://nominatim.openstreetmap.org/), © OpenStreetMap contributors, under the
[ODbL](https://www.openstreetmap.org/copyright). Attribution is required wherever those
coordinates are shown on a map.

Their usage policy asks for a genuine User-Agent and no more than one request per second;
`pincodeLocation.ts` honours both and caches every answer permanently, so a pincode is
looked up once for the life of the system.

## India Post

The pincode API at `api.postalpincode.in` is used as a cross-check when a broker types a
pincode. It is authoritative about post office names and years out of date about districts,
so its answer is displayed beside ours as a hint and never overwrites the address the
broker selected.

## District list

The 34 districts are the client's own list from the v1 form, which is current — it includes
the 2013 splits and Vav-Tharad (2024), none of which GeoNames knows about.

**Needs a human check before launch:** the taluka-to-district assignments for those newer
districts are curated by hand in `scripts/build-reference.ts`. A wrong entry puts a listing
in the wrong district's search results.
