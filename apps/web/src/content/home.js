/**
 * Content for the LocateX home page.
 *
 * Everything here is placeholder data standing in for the API described in
 * `docs/03-technical-spec.md`. Sections render from these shapes, so switching to
 * `GET /api/v1/properties`, `/reference/districts`, `/stats/public` and `/news` is a change
 * of data source, not a change of markup.
 */

const photo = (name) => `/images/locatex/photos/${name}.jpg`;

export const HERO = {
  image: photo("hero-farmland"),
  eyebrow: "Gujarat land marketplace",
  title: "Find land worth",
  rotatingWords: ["buying", "building on", "farming", "investing in"],
  text: "Agricultural land, NA plots and farm houses across Gujarat — listed by the people who own them, with the village, survey number and area you actually search by.",
};

/** Options for the hero search form — from `GET /api/v1/reference/*`. */
export const SEARCH_OPTIONS = {
  purpose: [
    { value: "sale", label: "Buy" },
    { value: "rent", label: "Rent / Lease" },
  ],
  landTypes: [
    { value: "", label: "All land types" },
    { value: "agriculture", label: "Agricultural land" },
    { value: "na", label: "NA plot" },
    { value: "farmhouse", label: "Farm house" },
    { value: "residential", label: "Residential plot" },
    { value: "commercial", label: "Commercial" },
    { value: "industrial", label: "Industrial" },
  ],
  districts: [
    { value: "", label: "All districts" },
    { value: "morbi", label: "Morbi" },
    { value: "rajkot", label: "Rajkot" },
    { value: "ahmedabad", label: "Ahmedabad" },
    { value: "surendranagar", label: "Surendranagar" },
    { value: "jamnagar", label: "Jamnagar" },
    { value: "mahesana", label: "Mahesana" },
    { value: "vadodara", label: "Vadodara" },
    { value: "banaskantha", label: "Banaskantha" },
  ],
  budgets: [
    { value: "", label: "Any budget" },
    { value: "0-2500000", label: "Under ₹25 L" },
    { value: "2500000-5000000", label: "₹25 L – ₹50 L" },
    { value: "5000000-10000000", label: "₹50 L – ₹1 Cr" },
    { value: "10000000-", label: "₹1 Cr +" },
  ],
};

/** Placeholder for `GET /api/v1/stats/public`. */
export const STATS = [
  { value: 1240, suffix: "+", label: "Listings live" },
  { value: 34, suffix: "", label: "Districts covered" },
  { value: 860, suffix: "+", label: "Verified sellers" },
  { value: 0, suffix: "%", label: "Brokerage charged" },
];

/** Placeholder for `GET /api/v1/reference/districts?withCounts=true`. */
export const DISTRICTS = [
  {
    slug: "morbi",
    name: "Morbi",
    image: photo("parcels-aerial-sq"),
  },
  {
    slug: "rajkot",
    name: "Rajkot",
    image: photo("wheat-field-sq"),
  },
  {
    slug: "ahmedabad",
    name: "Ahmedabad",
    image: photo("village-aerial-sq"),
  },
  {
    slug: "surendranagar",
    name: "Surendranagar",
    image: photo("golden-field-sq"),
  },
  {
    slug: "jamnagar",
    name: "Jamnagar",
    image: photo("terraced-fields-sq"),
  },
  { slug: "mahesana", name: "Mahesana", count: 61, image: photo("harvest-sq") },
];

/**
 * Placeholder for `GET /api/v1/properties?featured=true`.
 * Shapes match the `PropertyCard` contract so no card markup changes when the API lands.
 */
export const FEATURED = [
  {
    id: "PROP-1001",
    href: "/property-details-v1",
    image: photo("parcels-aerial"),
    imageAlt: "Agricultural land near Morbi",
    tags: [
      { className: "flag-tag primary", label: "Verified" },
      { className: "flag-tag style-1", label: "For Sale" },
    ],
    tagListClass: "d-flex gap-6",
    location: "Lakhdhirpur, Morbi, Gujarat",
    locationInImage: true,
    title: "12 Vigha canal-touch agricultural land",
    titleClass: "text-capitalize",
    titleLinkClass: "link",
    meta: [
      { icon: "icon-sqft", label: "Area:", value: "12 Vigha" },
      { icon: "icon-mapPin", label: "Survey:", value: "144/2" },
      { icon: "icon-bath", label: "Water:", value: "Canal" },
    ],
    avatar: "/images/avatar/avt-png1.png",
    avatarClass: "avatar avt-40 round",
    agent: "Posted by owner",
    price: "₹72,00,000",
    priceTag: "h6",
  },
  {
    id: "PROP-1002",
    href: "/property-details-v1",
    image: photo("plots-surveyed"),
    imageAlt: "NA plot near Rajkot",
    tags: [
      { className: "flag-tag primary", label: "Verified" },
      { className: "flag-tag style-1", label: "For Sale" },
    ],
    tagListClass: "d-flex gap-6",
    location: "Kuvadva Road, Rajkot, Gujarat",
    locationInImage: true,
    title: "NA plot with approved layout, 4500 sq ft",
    titleClass: "text-capitalize",
    titleLinkClass: "link",
    meta: [
      { icon: "icon-sqft", label: "Area:", value: "4500 sqft" },
      { icon: "icon-mapPin", label: "Type:", value: "NA" },
      { icon: "icon-bed", label: "Road:", value: "30 ft" },
    ],
    avatar: "/images/avatar/avt-png3.png",
    avatarClass: "avatar avt-40 round",
    agent: "Posted by broker",
    price: "₹41,50,000",
    priceTag: "h6",
  },
  {
    id: "PROP-1003",
    href: "/property-details-v1",
    image: photo("village-aerial"),
    imageAlt: "Farm house plot near Ahmedabad",
    tags: [
      { className: "flag-tag primary", label: "Verified" },
      { className: "flag-tag style-1", label: "For Sale" },
    ],
    tagListClass: "d-flex gap-6",
    location: "Bavla, Ahmedabad, Gujarat",
    locationInImage: true,
    title: "Farm house land with borewell and fencing",
    titleClass: "text-capitalize",
    titleLinkClass: "link",
    meta: [
      { icon: "icon-sqft", label: "Area:", value: "5 Acre" },
      { icon: "icon-mapPin", label: "Khaata:", value: "302" },
      { icon: "icon-bath", label: "Water:", value: "Borewell" },
    ],
    avatar: "/images/avatar/avt-png10.png",
    avatarClass: "avatar avt-40 round",
    agent: "Posted by owner",
    price: "₹1,15,00,000",
    priceTag: "h6",
  },
  {
    id: "PROP-1004",
    href: "/property-details-v1",
    image: photo("golden-field"),
    imageAlt: "Farmland near Surendranagar",
    tags: [
      { className: "flag-tag primary", label: "Verified" },
      { className: "flag-tag style-1", label: "For Sale" },
    ],
    tagListClass: "d-flex gap-6",
    location: "Wadhwan, Surendranagar, Gujarat",
    locationInImage: true,
    title: "20 Vigha open farmland on highway side",
    titleClass: "text-capitalize",
    titleLinkClass: "link",
    meta: [
      { icon: "icon-sqft", label: "Area:", value: "20 Vigha" },
      { icon: "icon-mapPin", label: "Survey:", value: "77" },
      { icon: "icon-bed", label: "Access:", value: "Highway" },
    ],
    avatar: "/images/avatar/avt-png2.png",
    avatarClass: "avatar avt-40 round",
    agent: "Posted by owner",
    price: "₹96,00,000",
    priceTag: "h6",
  },
  {
    id: "PROP-1005",
    href: "/property-details-v1",
    image: photo("wheat-field"),
    imageAlt: "Irrigated land near Jamnagar",
    tags: [
      { className: "flag-tag primary", label: "Verified" },
      { className: "flag-tag style-1", label: "For Sale" },
    ],
    tagListClass: "d-flex gap-6",
    location: "Dhrol, Jamnagar, Gujarat",
    locationInImage: true,
    title: "8 Vigha irrigated land with pipeline",
    titleClass: "text-capitalize",
    titleLinkClass: "link",
    meta: [
      { icon: "icon-sqft", label: "Area:", value: "8 Vigha" },
      { icon: "icon-mapPin", label: "Survey:", value: "51/1" },
      { icon: "icon-bath", label: "Water:", value: "Pipeline" },
    ],
    avatar: "/images/avatar/avt-png4.png",
    avatarClass: "avatar avt-40 round",
    agent: "Posted by broker",
    price: "₹58,00,000",
    priceTag: "h6",
  },
  {
    id: "PROP-1006",
    href: "/property-details-v1",
    image: photo("terraced-fields"),
    imageAlt: "Agricultural land near Mahesana",
    tags: [
      { className: "flag-tag primary", label: "Verified" },
      { className: "flag-tag style-1", label: "For Sale" },
    ],
    tagListClass: "d-flex gap-6",
    location: "Kadi, Mahesana, Gujarat",
    locationInImage: true,
    title: "15 Vigha land, two-side road touch",
    titleClass: "text-capitalize",
    titleLinkClass: "link",
    meta: [
      { icon: "icon-sqft", label: "Area:", value: "15 Vigha" },
      { icon: "icon-mapPin", label: "Khaata:", value: "118" },
      { icon: "icon-bed", label: "Access:", value: "2 roads" },
    ],
    avatar: "/images/avatar/avt-png5.png",
    avatarClass: "avatar avt-40 round",
    agent: "Posted by owner",
    price: "₹1,05,00,000",
    priceTag: "h6",
  },
];

/** Land categories for the browse strip. */
/**
 * The land types the product actually carries.
 *
 * `slug` is the API's own `propertyType` value, so the link filters rather than 404s — the
 * old list used invented slugs like "agriculture" and "farmhouse" that no endpoint knew,
 * and pointed at template pages that have since been removed.
 */
export const CATEGORIES = [
  {
    slug: "land",
    name: "Agricultural land",
    icon: "icon-farm",
    blurb: "Farmland with canal, borewell or well water.",
  },
  {
    slug: "plot",
    name: "NA plots",
    icon: "icon-land",
    blurb: "Converted, non-agricultural plots.",
  },
];

/** Placeholder for `GET /api/v1/news?active=true` — admin-posted, time-windowed. */
export const NEWS = [
  {
    id: "n1",
    title: "Jantri rates revised for Morbi district",
    date: "12 Aug 2026",
    text: "Check the updated circle rates before you finalise a price for your land.",
  },
  {
    id: "n2",
    title: "New: search by survey number",
    date: "04 Aug 2026",
    text: "Know the survey number? Search it directly and jump straight to the parcel.",
  },
];
