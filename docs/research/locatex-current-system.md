# Locatex v1 — how the current product actually works

Audit of `Locatex-final-backend` and `Locatex-final-frontend` as the baseline for the
rewrite. Everything below was read from the code, not from the README — where the README
and the code disagree, the code is recorded here and the disagreement is called out.

Companion documents: `dekhojamin-analysis.md` (the competitor/target UI), and the migrated
marketing site in `../homelengo-react`.

---

## 1. Shape of the system

| | |
| --- | --- |
| Backend | Node 18 + Express 4, Mongoose 7 on MongoDB Atlas, deployed at `locatex-final-backend.onrender.com` |
| Frontend | Static multi-page HTML + jQuery 2.2, Bootstrap 4, served from Vercel / `www.locatex.in` |
| Uploads | Multer → Cloudinary |
| Mail | Nodemailer (`utils/sendEmail.js`), used only for password reset |
| Frontend config | `js/env.js` sets a single global `API_BASE_URL` |

The frontend has no build step and no framework: 24 HTML pages, each with its own inline
`<script>` doing `fetch()` against the API. `header.html` and `footer.html` are injected at
runtime by `loadHeader()` / `loadFooter()` in `js/app.js`.

**Backend layout**

```
config/database.js
controllers/  admin  agents  auth  contact  message  properties  users
middleware/   auth (protect, authorize)   upload (multer + cloudinary)
models/       User  Property  Agent  Contact  Message  Blog
routes/       admin  agents  auth  contact  message  properties  users
scripts/      seed  createAdmin  recreateAdmin  testAdmin  fixAgentLicenseIndex
```

---

## 2. Authentication — what it really is

**It is Bearer-token auth in `localStorage`, not cookie auth.**

- `POST /api/auth/login` accepts `{ email | mobile, password }`, verifies with bcrypt,
  and returns the JWT **in the JSON body** (`data.token`).
- `middleware/auth.js` `protect` reads **only** `req.headers.authorization` starting with
  `Bearer`. There is no cookie parsing anywhere; `cookie-parser` is not even a dependency.
- The frontend stores it with `localStorage.setItem('auth_token', …)` plus a copy of the
  user object in `current_user`. Three different key names are read across the codebase —
  `auth_token`, `token`, `user_token` — because different pages were written at different
  times.
- `POST /api/auth/logout` is a **no-op**: it returns a success message and nothing else.
  `handleLogout()` clears localStorage client-side. A stolen token stays valid until it
  expires (`JWT_EXPIRE`), and there is no refresh token and no revocation list.

So "JWT cookie-based auth" is a **change to build**, not behaviour to port. Moving to
httpOnly cookies means: set the cookie on login/register, read it in `protect`, clear it on
logout, add CSRF protection for state-changing requests, and keep `credentials: 'include'`
on every frontend call. The CORS config already sets `credentials: true` and has an origin
allowlist, so that part is ready.

Also present: registration (`POST /api/auth/register`, optionally with `role`), `GET /me`,
profile update, password change, forgot/reset password by emailed token (10-minute expiry),
and avatar upload to Cloudinary.

### Bootstrap admin

`npm run create-admin` seeds `admin@realestate.com` / `Admin@123` with `role: 'admin'`.
Those credentials are in the repo — rotate them before the new system goes anywhere near
production data.

---

## 3. Roles — target versus reality

The four roles you described (**admin, broker, user, viewer**) do **not** exist in the
code. What exists:

```js
role: { type: String, enum: ['user', 'agent', 'admin'], default: 'user' }
```

| Intended | Present in v1 | Notes |
| --- | --- | --- |
| admin | `admin` | Full control; `authorize('admin')` on all `/api/admin/*`, `/api/users/*`, most `/api/contact/*` |
| broker | `agent` (+ `Agent` profile) | The UI calls it "Find a Broker" while the API calls it agent — same thing under two names |
| user | `user` | Default on registration; can post properties and favourite them |
| viewer | — | Nothing corresponds to it. Anonymous visitors are simply unauthenticated |

Two more places use "broker" vocabulary without being a role:

- `Property.insertedBy: ['Owner', 'Broker']` — who is submitting the listing, chosen by a
  radio button on the submit form. Not tied to the account's role at all.
- `find-broker.html` lists `Agent` documents.

Role enforcement is honest on the server (`protect` + `authorize`) with two exceptions
worth fixing in the rewrite:

- **`/api/messages/*` has no auth at all.** `GET /api/messages` returns every inquiry ever
  submitted and `DELETE /api/messages/:id` deletes one — both unauthenticated.
- **The admin dashboard guard is client-side only**: `admin-dashboard.html` reads
  `current_user.role` from localStorage and redirects. Anyone can flip that value; the
  server still blocks the admin API calls, so the result is a broken-looking page rather
  than a breach — except for the unprotected messages endpoints above.

---

## 4. Property submission — what we collect today

The form is `submit-property.html`, posted as `multipart/form-data` to
`POST /api/properties` with a `Bearer` header. Any authenticated user may post; the
listing is created with `approvalStatus: 'pending'` and `isPublished: false`, so an admin
must approve it before it appears publicly.

### Fields on the form

| Section | Fields | Required |
| --- | --- | --- |
| Basic Information | `title`, `status` (for-sale / for-rent), `type` (apartment / house / commercial / industrial / land), `insertedBy` (Owner / Broker radio), `totalAreaAcres`, `price` | title, area, price |
| Property Gallery | 8–10 photos via Dropzone → `images[]` | — |
| Location | `state`, `district`, `taluka`, `village`, `pincode` | all five |
| Amenities | checkboxes: `fencing`, `house`, `electricity`, `kuvo`, `underground_pipeline` | — |
| Disadvantages | checkboxes: Underground Cable / Line, Borewell / Well, Passing Vijpool, Passing Canal | — |
| Government record | `khaataNumber`, `surveyNumber`, `govArea` (format `હે. આરે. ચો.મી. = ૦-૬૪-૭૫`) | all three |
| Documents | `document712` (7/12), `document8A`, `documentUtarotar`, `otherDocuments[]` | — |
| Contact | `contactName`, `contactEmail`, `contactPhone`, `whatsappNumber` | first three |
| Detailed information | `message` → stored as `description` | — |

This is clearly a **Gujarat agricultural-land product**: 7/12 and 8A extracts, Utarotar,
khaata and survey numbers, area in Vigha/Acre and the government's Hectare-Are-Sq.metre
string, village/taluka/district hierarchy.

### What actually reaches the database

`Property` stores: title, description, price, status, type, `insertedBy`, `govDetails`
(khaataNumber / surveyNumber / area), `disadvantages[]`, `totalArea` / `areaVigha` /
`areaAcre`, `location` (address, city, state, district, taluka, village, zipCode,
coordinates), `amenities[]`, `images[]` (url / alt / isPrimary), `contactInfo`
(name / email / phone / whatsappNumber), `owner`, `agent`, `views`, `isFeatured`,
`isPublished`, `approvalStatus`, timestamps.

### Three defects to fix rather than port

1. **Uploaded documents are silently discarded.** `createProperty` builds
   `propertyData.documents = { document712, document8A, documentUtarotar, otherDocuments }`,
   but `Property` has no `documents` path. Mongoose strict mode drops it — the files reach
   Cloudinary, the links are lost. Same for `propertyData.landInfo` (fencing, borewell,
   houseOnLand, electricity, expectedPricePerUnit, paymentTerms, legacyLand).
2. **Every property is saved at coordinates 0,0.** The submit page hard-codes
   `formData.append('latitude', '0'); formData.append('longitude', '0');` — there is no map
   picker, no address geocoding, no way for the seller to place a pin. The schema requires
   the fields and defaults them to 0.
3. **Dead filters in `getProperties`.** It filters on `propertyType` (the schema field is
   `type`) and on `specifications.bedrooms` / `.bathrooms` / `.area`, which do not exist in
   the schema. Those query parameters silently match nothing, and `area-asc` / `area-desc`
   sorting does nothing.

---

## 5. The map today

There is **no working map of real properties**.

- `js/maps.js` ships the theme's demo dataset — a hard-coded `properties` object with
  London coordinates (51.54, −0.11), fake titles like "Big Head House".
- `js/app.js` calls `generateMap(51.541216, -0.095678, 'Hydda.Full')` whenever an element
  with `id="map"` is on the page. It never calls the API.
- The plumbing is decent and reusable: Leaflet + `leaflet-providers` + `markercluster`,
  custom `divIcon` markers, popups built by `drawInfoWindow()`, list-hover ↔ marker
  highlighting, and a re-render on `moveend`.
- The contact page uses a separate Google Maps snippet with a hard-coded New York pin.

Combined with the 0,0 coordinates above, this is the single largest gap against
DekhoJamin, whose entire value proposition is the pin plus the plot boundary.

---

## 6. Feature inventory by page

| Page | What it does | Backing API |
| --- | --- | --- |
| `index.html` | Hero search UI, featured/latest properties | `GET /api/properties?limit=6&approvalStatus=approved` |
| `properties-list-rightside.html` | Listing grid/list with sorting and filter checkboxes | `GET /api/properties` |
| `properties-details.html` | Single property, gallery, contact/inquiry | `GET /api/properties/:id` (increments `views`) |
| `submit-property.html` | The submission form above; also edit mode via `?id=` | `POST` / `PUT /api/properties` |
| `my-properties.html` | Seller's own listings, delete | `GET /api/properties/my` |
| `favorited-properties.html` | Saved listings — **localStorage only**, ignores the favourites API that exists | — |
| `find-broker.html` | Broker/agent directory with filters | `GET /api/agents` |
| `agent-registration.html` | Apply to become an agent (bio, company, specialties, socials, avatar) | `POST /api/agents/registration-request` |
| `admin-agent-requests.html` | Admin reviews/verifies agent applications | `GET /api/agents?verified=false` |
| `admin-dashboard.html` | Stats, pending-property approve/reject, all properties, users list + activate/deactivate/delete, inquiry messages | `/api/admin/*`, `/api/messages` |
| `messages.html` | Inbox/sent UI — calls `/api/messages/inbox`, `/sent`, `/:id/archive`, **none of which exist** on the server | broken |
| `my-profile.html` | Profile, avatar upload, account details | `/api/auth/profile`, `/api/auth/avatar` |
| `login` · `signup` · `forgot-password` · `reset-password` · `change-password` | Auth screens (email **or** 10-digit mobile + password) | `/api/auth/*` |
| `contact.html` · `about.html` · `faq.html` · `404.html` | Static content, contact form | `POST /api/contact` or `/api/messages` |

### Admin can currently

View property stats; list pending properties; approve or reject (with a reason); list and
delete any property; list users, activate/deactivate them, change roles, delete them;
verify agent applications; read and delete inquiry messages.

### Models not wired up

`Blog.js` exists (title, slug, excerpt, content, featuredImage, author, status, comments,
views, likes) but has **no routes and no controller** — dead code today, and a ready
starting point if the new version wants a content section.

`Contact.js` is a much richer inquiry model than `Message.js` (type, priority, status,
assignedTo, response tracking, links to property and agent). Both are in use for
overlapping purposes: the contact form posts to one, the admin dashboard reads the other.
The rewrite should keep one.

---

## 7. Carry-over list for v2

**Keep and port**

- The Gujarat land data model: khaata / survey / 7-12 / 8A / Utarotar, Vigha–Acre–Hectare
  areas, state → district → taluka → village hierarchy, amenities and disadvantages as
  domain vocabulary. This is the real asset and matches what DekhoJamin does not have.
- Approval workflow (`pending → approved | rejected`) with admin review.
- Agent/broker profiles with verification, ratings and reviews.
- Owner-vs-Broker attribution on each listing.

**Fix while porting**

- Persist documents and land info (add the schema paths, or the uploads keep vanishing).
- Capture real coordinates — map picker on submit, then a real map of real listings.
- One inquiry model, not two; protect `/api/messages`.
- Server-side favourites instead of localStorage.
- Align filter names with the schema so the listing filters actually filter.
- Single token key, or none at all if we move to httpOnly cookies.

**Build new**

- httpOnly-cookie JWT sessions with refresh and real logout.
- The four-role model (admin / broker / user / viewer) — needs an enum change, a
  permission matrix, and server-side guards on every route, plus a decision on what
  "viewer" may see that an anonymous visitor may not.
- Plot boundary polygons and Plus Code addressing (see `dekhojamin-analysis.md`).
- Marker clustering and viewport-aware loading, since v1's cluster plugin is already there
  and DekhoJamin's 1,357-markers-at-once approach is the thing not to copy.
