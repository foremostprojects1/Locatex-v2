# DekhoJamin — feature & map teardown

Reference research on <https://dekhojamin.com>, an Indian land marketplace the client
pointed to as the UI/feature target. Captured **16 Aug 2026** by loading the live site in
headless Chrome and reading the page source; findings below are from the site itself, not
from documentation.

Evidence kept next to this file:

- `screenshots/map-listings-view.png` — the split map/list page
- `screenshots/property-boundary-polygon.png` — a plot boundary drawn on a property page
- `dekhojamin-map-page-source.html` — saved source of `/map-property-listings`, which
  contains the whole map implementation. **Their Google Maps API key has been redacted**:
  it is a live, billable credential belonging to someone else and does not belong in our
  repository. The key is visible to anyone who views their page source, so nothing is lost
  by removing it here. inline

---

## 1. What the site offers

### Navigation and pages

`Home · Properties · About Us · Contact · Map View · DJ Prime · My Account · Post property FREE`

| Page | URL |
| --- | --- |
| Listings (grid/list) | `/property-listings` |
| Map listings | `/map-property-listings` |
| Property detail | `/property-details/{slug}` |
| Agent profile | `/public-profile/{name}-{id}` |
| Paid plans | `/prime` |
| Seller dashboard | `/my-dashboard` |
| Create listing | `/create-listing` (login required) |
| SEO landing pages | `/property-listings/{land-type}/{deal}/{city}` |

The SEO landing pages are generated per land type × deal × city (e.g.
`/property-listings/agriculture/sale/ahmedabad`) and are linked in bulk from the homepage
footer area — a large share of their organic surface.

### Search and filtering

- Free-text keyword **and** direct Property ID lookup
- Land type: Agriculture · Commercial · Industrial · Farm House · Residential · NA
- Listing type: For Sell · For Rent · For Lease
- Price bands: Under ₹50L · ₹50L–₹1Cr · ₹1Cr–₹2Cr · ₹2Cr+
- Cascading location: **State → District → Taluka → Village**, all Indian states, Select2
  dropdowns with search
- Sort: Newest · Low to High Price · High to Low Price
- Grid / list / map views over the same result set
- A separate mobile filter panel whose values are copied to and from the desktop form

### Listing card

Verified and featured badges, price plus **price per unit** (₹5000000/Bigha), area in
Bigha / Acre / Sqft / Sq yard, land type chip, address, seller name and avatar, relative
posting time.

### Property detail page

Gallery with two tabs (Gallery View / Map View), Property Details, **Amenities**,
**Soil Type**, property statistics, description, **reviews and ratings**, agent card,
similar properties, and a structured property ID: `GJ-01-382150-0040`
(state · code · pincode · serial).

Lead capture is aggressive and worth copying: the inquiry form arrives pre-filled with
the property title and ID ("Hello, I am interested in Land for Sale in Hansalpur
GJ-01-382150-0040"), next to **Send Message**, **Call** and **WhatsApp** buttons. Clicks
on Call hit `/property/call-log`, so phone leads are measured, not lost.

### Accounts and monetisation

- Phone **OTP login** (`/send-otp`, `/otp-verify`)
- Free listing creation; seller dashboard; public agent profiles with experience
- **DJ Prime** packages: ₹4,999 premium listing → ₹24,999 (360° view, drone shoot, reel)
  → ₹99,999 (land survey / *Mapni*, newspaper notice, title certificate, document
  verification) → ₹1,49,000 full project details. Positioning: zero commission, direct
  access to up to 30 owners, prime-exclusive properties.

### Stack

Laravel (Apache, `XSRF-TOKEN` / `dekho_jamin_session` cookies), jQuery 3.6, Bootstrap
5.3.2, Select2 4.1, Slick carousel, SweetAlert2, reCAPTCHA v3, GA4, Leaflet 1.9.4 and the
Google Maps JS API.

---

## 2. How the map works

### Base map: Leaflet driving Google tiles

`/map-property-listings` is a split screen — Leaflet map on the left, scrollable result
list on the right. The base layer is **Google tiles rendered inside Leaflet** through the
`googleMutant` plugin, so they get Leaflet's marker/popup API with Google's imagery:

```js
map = L.map('map', { zoomControl: true, attributionControl: true, fullscreenControl: true })
       .setView([22.6708, 71.5724], 8);          // Gujarat
L.gridLayer.googleMutant({ type: 'roadmap', maxZoom: 21 }).addTo(map);
markersLayer = L.layerGroup().addTo(map);
```

The Google Maps API key is exposed in the page source (protection can only be domain
referrer restriction). On load the page asks for browser geolocation and recenters to the
visitor at zoom 12 — and separately POSTs the visitor's coordinates to
`/store-browser-location` on their backend.

### Data flow: one request returns both list and pins

Filters are serialised from the desktop filter form and posted once:

```
POST /ajax-map-property-listings   →   { html, count, markers[] }
```

The server renders the card list as HTML **and** returns a parallel marker array. Each
marker carries everything the popup needs:

```json
{ "id": 1493, "latitude": 23.08, "longitude": 72.06, "slug": "land-for-sale-in-hansalpur",
  "title": "…", "price": "₹4.5 Cr", "image": "…", "land_area": "9.00",
  "land_area_unit": "Bigha", "type": "agriculture", "location": "33M9+J6 Hansalpur…" }
```

Rendering clears the layer group, creates one marker per item, binds a popup, and frames
everything with `map.fitBounds(bounds, { padding: [30, 30] })`.

### Pins

Markers are CSS dots (`L.divIcon`, 18px, white border), **colour-coded by land type**:

| Type | Colour |
| --- | --- |
| Agriculture | `#1e7d32` dark green |
| Commercial | `#3498db` blue |
| Industrial | `#e74c3c` red |
| Farm House | `#39ff14` neon green |
| Residential | `#f1c40f` yellow |
| NA | `#f39c12` orange |

The homepage's map section reuses the same dot component but colours by **deal type**
instead — sale green `#2ecc71`, rent yellow `#f1c40f`, lease blue `#3498db`.

### List ↔ map linkage

```js
$(document).on('mouseenter', '.property-listing-card', function () {
  const id = $(this).data('id');
  propertyMarkers[id]?.openPopup();
  propertyMarkers[id]?.setZIndexOffset(1000);
});
```

Hovering a card opens that property's popup and lifts the pin above its neighbours;
leaving closes it. Clicking a pin opens a popup card — photo, title, price, area, type,
address — linking to the property page in a new tab. There is no reverse highlight
(clicking a pin does not scroll the list).

### Pinpointing a property that has no street address

This is the part the client is really reacting to, and it is two separate ideas:

**Google Plus Codes as the address.** Listings display an address like
`33M9+J6 Hansalpur Sereshvar, Gujarat, India` — a Plus Code derived from the stored
coordinates. Farmland has no postal address, so this gives every parcel a precise,
shareable, human-quotable location.

**Boundary polygons, not just a pin.** Each property stores an array of vertices, and the
detail page's Map View draws the **actual outline of the plot** in red over Google Maps:

```js
const coordinates = [{"lat":23.0841,"lng":72.0666},{"lat":23.0831,"lng":72.0678},
                     {"lat":23.0834,"lng":72.0688},{"lat":23.0848,"lng":72.0683}];
new google.maps.Polygon({ paths: polygonCoords, strokeColor: "#FF0000",
  strokeOpacity: 0.8, strokeWeight: 4, fillColor: "#ffffff", fillOpacity: 0, map });
```

Loaded with `maps/api/js?...&libraries=geometry,drawing&callback=initFencingMap` at zoom
16 with Map/Satellite toggle, Street View and fullscreen. Internally they call this the
*fencing map*. See `screenshots/property-boundary-polygon.png`.

**Not verified:** how the seller draws that boundary. `/create-listing` redirects to login,
so the posting flow could not be inspected. The `drawing` library being loaded strongly
suggests a Google `DrawingManager` polygon tool in the posting form, but that is an
inference, not an observation — confirm with an account before building against it.

### Limits of their implementation

Worth knowing before copying it wholesale:

- **No clustering and no viewport loading.** There are no `moveend` / `zoomend` handlers;
  every matching property ships in one response. A default load rendered **1,357 markers
  and 1,357 cards at once** (measured). It works now and will be the first thing to break
  as inventory grows.
- The map never refetches on pan or zoom, so "search this area" behaviour does not exist.
- No draw-your-own-search-area, no saved searches, no marker → list highlight.
- Visitor coordinates are sent to their server on first visit; if we copy that, it needs a
  consent story.

---

## 3. Gap list against our React app

The migrated Homelengo app already covers the split map/list layout, filters, listing
cards, agent lead forms and property detail pages. To reach parity with DekhoJamin:

| Feature | Effort | Notes |
| --- | --- | --- |
| Plot boundary polygons | Large | Data model (vertex array per property), seller drawing tool, renderer on detail + map pages |
| Plus Code addressing | Small | Derive from lat/lng; display as the address line |
| India location cascade | Medium | State → District → Taluka → Village tables + dependent endpoints |
| Area units (Bigha/Acre) | Small | Unit field plus price-per-unit derivation |
| Land-type marker colours | Small | Extend our `PropertyMap` marker rendering |
| Hover card ↔ pin popup | Small | We already keep markers keyed by id |
| OTP login | Medium | Backend work |
| Call / WhatsApp lead logging | Small | Endpoint + click handlers |
| Paid listing tiers | Medium | Product decision first |

Our `PropertyMap` uses the Google Maps JS API directly. Matching DekhoJamin's look does
**not** require switching to Leaflet — the same tiles, polygons and Street View are
available in the API we already use. Only adopt Leaflet + googleMutant if we want
Leaflet's plugin ecosystem (clustering, draw tools) specifically.
