# LocateX v2 — Task board

Living checklist so work can stop and restart without losing the thread. Update the status
column as tasks move. **If execution was interrupted, read "Where we are" first.**

- Source of truth for the design: the approved plan at
  `https://claude.ai/code/artifact/96d75530-b258-4de5-b73c-7385314ac877`
- Decisions: `05-decision-log.md`
- Code root: `Loca/locatex/` (pnpm workspace)

Status key: `todo` · `wip` · `done` · `blocked`

---

## Where we are

| | |
| --- | --- |
| **Current phase** | Phase 12 — Hardening & launch (Phase 6 is blocked, see below) |
| **Last completed** | Phase 10 — Chat: threads, messages, read receipts, blocking, reporting and the 24-hour unread digest (186 API + 48 contract tests green, 20 deployable checks) |
| **Next action** | P12.1 — security review |
| **Blocked on** | **Phase 6 (Google Drive) needs the client to connect a Google account** — nothing else is waiting. Also still needed: a MongoDB Atlas URI, an SMS provider for OTPs, a Gmail app password, and a human check of the curated taluka→district table |
| **Blocked on** | nothing to code. Two inputs needed before launch: a MongoDB Atlas URI (tests use an in-memory replica set, so development is unblocked) and an **SMS provider for phone OTPs** — see the note under Phase 2 |

**To resume:**

```bash
cd Loca/locatex
pnpm install
pnpm test                     # 234 tests should pass
pnpm build && pnpm start      # the whole product on http://localhost:8080
```

Then continue at the first `todo` below. A MongoDB Atlas URI and a 32-character
`JWT_SECRET` in `apps/api/.env` are needed before `pnpm dev` will boot against real data.

---

## Phase 0 — Decisions · `done`

| # | Task | Status |
| --- | --- | --- |
| P0.1 | Requirements analysis, v1 audit, competitor teardown | `done` |
| P0.2 | Architecture, UI spec, technical spec | `done` |
| P0.3 | Build plan approved by client | `done` |
| P0.4 | All 13 decisions answered and recorded | `done` |
| P0.5 | Home page rebranded to LocateX and approved | `done` |

## Phase 1 — Foundations · `done`

| # | Task | Status | Verify by |
| --- | --- | --- | --- |
| P1.1 | pnpm workspace: `apps/api`, `packages/contracts` | `done` | `pnpm -r list` shows both |
| P1.2 | TypeScript strict everywhere, path aliases, build scripts | `done` | `pnpm typecheck` passes |
| P1.3 | Config loader with zod validation, `.env.example` | `done` | Boot fails loudly on a missing var |
| P1.4 | Structured logging (pino) + request id middleware | `done` | Every request logs one JSON line |
| P1.5 | Error model: `AppError`, codes enum, handler, RFC-9457 body | `done` | Unit tests on the mapper |
| P1.6 | Express 5 app skeleton, CORS allowlist, helmet, rate limit | `done` | `/healthz` returns 200 |
| P1.7 | MongoDB connection (Atlas), `strict: 'throw'` base schema options | `done` | `/readyz` reports db up |
| P1.8 | `migrate-mongo` set up, first migration (indexes) | `done` | `pnpm migrate:up` runs clean |
| P1.9 | Redis + BullMQ bootstrap, one no-op queue + worker | `done` | Worker logs a processed job |
| P1.10 | Vitest + Supertest harness | `done` | `pnpm test` green |
| P1.11 | ESLint + Prettier shared config | `done` | `pnpm lint` clean |
| P1.12 | GitHub Actions: install → lint → typecheck → test | `done` | Workflow file committed |
| P1.13 | `packages/contracts` with the first shared zod schemas | `done` | Imported by api and web |

### Phase 1 notes

- **Price rule corrected.** Writing the test proved the approved ±10% band leaks the exact
  price as its midpoint on every realistic land price. Replaced with a fixed-rung ladder that
  many prices share — see D5 in `05-decision-log.md`. `publicPriceBand()` is the only price
  shape allowed out to a guest.
- TypeScript **project references** wire `@locatex/contracts` into the API, so `tsc -b` builds
  them in order and the API always type-checks against the compiled contract.
- Mongoose is set to `strict: 'throw'` and `strictQuery: 'throw'` globally — the specific
  guard against v1's silent field-drop that destroyed uploaded documents.
- `req.id` is typed by pino-http as `string | number`; use `requestIdOf(req)` rather than
  augmenting Express, which conflicts with it.
- Mongo comes from an **Atlas** cluster. It must be a replica set, because the submit and
  approve flows use transactions and standalone Mongo refuses them — Atlas is one by default.
  Redis runs locally (or hosted) on `REDIS_URL`.
- The worker is a second process from the same checkout (`pnpm worker`). Every queue already
  exists (`email`, `chatDigest`, `drive`, `maintenance`); handlers are registered per feature.

## Phase 1b — One deployment · `done`

Added after the decision to ship API and web as a single unit.

| # | Task | Status | Verified by |
| --- | --- | --- | --- |
| P1b.1 | Git repository initialised, web app moved to `apps/web` | `done` | 438 files tracked, no `node_modules`/`dist`/`.env` |
| P1b.2 | API serves `apps/web/dist`; `/api` keeps its JSON contract | `done` | 9 integration tests |
| P1b.3 | SPA fallback for client-side routes | `done` | `/faq` renders on a hard refresh |
| P1b.4 | Cache policy: assets immutable, `index.html` never cached | `done` | Response headers asserted |
| P1b.5 | CSP applied when the API serves the page | `done` | Page renders with zero console errors |
| P1b.6 | Same-origin CORS fix (was a 500 on every asset) | `done` | 3 regression tests |
| P1b.7 | `QUEUE_PREFIX` namespacing for BullMQ | `done` | Queue test runs in its own namespace |
| P1b.8 | Deploy as one Node process (no container) | `done` | `pnpm build && pnpm start` verified end to end |

## Phase 2 — Auth & roles · `done`

| # | Task | Verify by |
| --- | --- | --- |
| # | Task | Status | Verified by |
| --- | --- | --- | --- |
| P2.1 | User model: 3 roles, status, token version, profile subdocs | `done` | Strict schema; role/phone/email uniqueness tests |
| P2.2 | Register (buyer) with the brief's fields | `done` | 5 tests, including a rejected `role: admin` attempt |
| P2.3 | **Email link + phone OTP — both mandatory** | `done` | Login refused until both confirmed; OTP burns after 5 wrong guesses |
| P2.4 | Login / refresh rotation / real logout, JWT httpOnly cookies | `done` | Replayed token revokes the whole family |
| P2.5 | CSRF double-submit | `done` | 3 tests; enforced only once a session cookie exists |
| P2.6 | Role guards + ownership policies | `done` | 5 matrix tests incl. suspension and token-version revocation |
| P2.7 | Password change (revokes other sessions) + forgot/reset | `done` | 4 tests; reset links are single use |
| P2.8 | Broker application → admin approval → role upgrade | `done` | Full flow: apply → approve → role changes; reject needs a reason |

**Open input needed:** phone OTPs are generated, rate limited and verified, but nothing
sends them yet — no SMS provider has been chosen (MSG91, Fast2SMS and Twilio are the usual
options for India). The `SmsSender` port is in place, and development logs the code instead.
A provider must be picked before real users sign up.

## Phase 3 — Reference data (Gujarat) · `done`

| # | Task | Status | Verified by |
| --- | --- | --- | --- |
| P3.1 | District / taluka / village hierarchy for Gujarat | `done` | 34 districts (incl. the 2013 splits and Vav-Tharad), 394 talukas, 8,917 villages — every district has talukas |
| P3.2 | Pincode locations | `done` | Resolved from a geocoder at runtime and cached; GeoNames coordinates kept only as a hint — see below |
| P3.3 | India Post lookup with a 30-day cache | `done` | Cross-checked and reported when it disagrees; never overwrites the broker's choice |
| P3.4 | `/reference/*` cascade endpoints with ETags | `done` | 304 on a repeat request; prefix search on villages |
| P3.5 | Amenity + disadvantage collections, **including the new attributes** | `done` | v1's nine carried over with `legacyValue`, plus road/water/soil/fencing/electricity |

**Why the pincode design changed during the phase.** The plan said to seed centroids from
GeoNames. Building it showed that would have been wrong: GeoNames' own readme says the
coordinates are algorithmic, 1,343 Gujarat rows carry the lowest accuracy flag, 608 of
1,026 pincodes give every village one identical point, and the average for 363641 lands
about 90 km from Morbi. Seeding those would have drawn a confident circle around a number
we do not trust. The hierarchy is seeded; the location is resolved at runtime from
Nominatim (which returns a bounding box, so the radius is measured) and cached permanently.

**Needs a human check before launch:** taluka-to-district assignments for the districts
created after the GeoNames snapshot are curated by hand — see `docs/attribution.md`.

## Phase 4 — Property core · `done`

| # | Task | Status | Verified by |
| --- | --- | --- | --- |
| P4.1 | Property schema incl. gov record, area units, precision fields | `done` | Reference slugs checked against Phase 3; unknown district, cross-district taluka and invented amenity all rejected with the field named |
| P4.2 | Status state machine (draft → pending → approved/rejected → sold) | `done` | 7 statuses, 12 transitions as a table; illegal moves return 409, rejection without a reason 400 |
| P4.3 | Search: filters, pagination, `2dsphere` radius query | `done` | Keyset pagination proven disjoint across pages and under price ties; radius query separates Morbi from Surat |
| P4.4 | Role-aware serializers: price band, contact hidden, pin hidden for guests | `done` | Guest response asserted free of the exact price, phone, email, survey number and pin |
| P4.5 | Views counter, featured flag | `done` | The owner's own visit is not counted; only an admin may feature, and only a live listing |

### Phase 4 notes

- **The guest pin is snapped to a grid, not jittered.** A random offset re-rolled per request
  could be averaged away by asking a few times; a 0.01° cell (~1.1 km) returns the same answer
  every time, so repeating the request reveals nothing that asking once did not.
- **Pagination is keyset, not `skip`.** With listings being approved while someone is
  scrolling, `skip` silently repeats and drops rows. The cursor carries (sort value, id) and
  is opaque, and a crafted cursor is rejected rather than reaching a query operator.
- **`sanitizeFilter` bites any filter we write ourselves.** It wraps any value containing a
  `$` key in `$eq`, which broke `$in`, `$gte`, `$all`, `$text` and `$geoWithin` alike — the
  same trap as the `$regex` one in Phase 3. Operator objects built from validated input are
  now marked with `mongoose.trusted()` rather than turning the protection off.
- **A live listing keeps its price and words editable; everything reviewed is frozen.** An
  administrator is not exempt — an admin quietly editing a reviewed survey number is exactly
  the change nobody would ever find.
- Indexes are created by migration rather than by Mongoose at boot, so a deploy never builds
  an index in the foreground against a live Atlas collection.

## Phase 5 — Submit wizard · `done`

| # | Task | Status | Verified by |
| --- | --- | --- | --- |
| P5.1 | Server-side draft + autosave endpoints | `done` | A draft reopened from a second sign-in still holds what was typed; out-of-order autosaves merge instead of overwriting |
| P5.2 | Five-step wizard UI on the LocateX theme | `done` | `apps/web/src/features/submit-property/`; steps are navigable in any order, submission is gated on all five validating |
| P5.3 | Shared zod validation (contracts package) | `done` | Each step's schema is a `.pick()` of `createPropertySchema`, so the message while typing is the rule that accepts the listing |
| P5.4 | Map pin picker + approximate fallback + precision recording | `done` | Exact pins are stored as given; approximate ones resolve through the pincode and carry a measured radius |
| P5.5 | Amenities / disadvantages / new attributes in the form | `done` | Both lists come from `/reference/land-attributes`, grouped as the API groups them |

### Phase 5 notes

- **Drafts are a separate collection, not a relaxed listing.** A listing's schema requires a
  title, a price, an area and a location; a draft is by definition missing most of them.
  Loosening `properties` to hold half-filled forms would have given up the guarantee that
  anything in that collection is complete.
- **Autosave merges, it does not replace.** On a phone, a save for step two can arrive after
  a save for step three. Merging by top-level key means a late request cannot erase the steps
  it said nothing about.
- **The map has no API key.** The picker uses OpenStreetMap tiles through Leaflet, so it
  works today — we have no Google Maps key, and the one found in the v1 source belonged to a
  competitor. `services/googleMaps.js` still holds the loader; switching is a change to
  `MapPicker.jsx` alone. **A decision the client should confirm** — see below.
- **The pin is the map's centre under a fixed crosshair**, not a draggable marker: on a phone
  a marker is smaller than a fingertip and sits under the finger placing it.
- The wizard adds ~230 KB gzipped to the `AddProperty` chunk (Leaflet, zod, the contracts
  package). It is lazily loaded, so only brokers opening the form pay for it.

**Needs a decision:** Google Maps or OpenStreetMap for the pin picker. OSM costs nothing and
needs no key; Google is what the client admired on dekhojamin.com and would need a key, a
billing account and a budget alert. The picker works either way.

## Phase 6 — Google Drive · `blocked`

**Cannot start until the client connects a Google account** (decision D1: uploads go to the
site owner's personal Drive). Everything else in the plan is unblocked, so Phase 7 was taken
first and Phase 8 is next.


| # | Task | Verify by |
| --- | --- | --- |
| P6.1 | `DocumentStorage` interface + in-memory fake for tests | Use cases test without Google |
| P6.2 | Admin "Connect Google Drive" OAuth flow, encrypted refresh token | Reconnect after revoke works |
| P6.3 | Folder strategy + metadata records | Folder ids stored, never searched by name |
| P6.4 | Resumable upload session + confirm + versioning/archive | 25 MB PDF resumes after a killed connection |
| P6.5 | **Quota monitor + 80% admin banner** (no storage upgrade — 15 GB only) | Alert fires in a simulated test |
| P6.6 | Documents only to Drive; images to the CDN | Verified by upload paths |

## Phase 7 — Approval & admin · `done` (P7.2 deferred)

Taken before Phase 6 because Phase 6 cannot start until a Google account is connected.

| # | Task | Status | Verified by |
| --- | --- | --- | --- |
| P7.1 | Approval queue | `done` | `/admin/properties` defaults to what is waiting; drafts never appear in anyone's queue |
| P7.2 | Document viewer | `deferred` | Nothing to view until Phase 6 stores documents. The queue already shows the government record the broker typed |
| P7.3 | Approve/reject with reason | `done` | Built in Phase 4's state machine; the dashboard will not send a rejection under five characters and the server refuses one anyway |
| P7.4 | Users: activate/deactivate, verify brokers | `done` | Suspension raises the token version, so sessions end on the next request rather than at token expiry |
| P7.5 | KPI cards | `done` | Two aggregations rather than seven counts; every status appears, as an honest zero if unused |
| P7.6 | News/ads with start/end | `done` | Live is derived from the dates on every read; an edit that supplies only an end is checked against the stored start |
| P7.7 | Contact-us inbox | `done` | The message is stored first and emailed second; both the admin and the sender are notified |

### Phase 7 notes

- **The contact form no longer only emails.** v1 posted to a PHP script that sent mail and
  kept nothing, so a message lost to a spam folder was lost for good. The record is now
  written first and the email is a notification about it — a failed send is logged, not
  surfaced to the visitor, because their message *was* received.
- **A timed item has a window, not a "published" flag.** A flag has to be flipped by
  something, and the job meant to flip it will one day not run, leaving last month's offer on
  the homepage. Two dates are true whether or not anything is running.
- **Suspension ends sessions immediately.** Raising `tokenVersion` invalidates every access
  token already in circulation. Without it, someone suspended for cause keeps working until
  their token expires — exactly the window in which the damage gets done.
- **Two guards nobody can talk their way past:** an administrator cannot change their own
  status, and the last active administrator cannot be suspended. Either would lock everyone
  out of the dashboard.

## Phase 8 — Email · `done`

| # | Task | Status | Verified by |
| --- | --- | --- | --- |
| P8.1 | `Mailer` interface + Gmail SMTP adapter | `done` | Chosen by configuration, not `NODE_ENV`; with no `SMTP_HOST` the system logs instead of sending |
| P8.2 | Eleven templates | `done` (not React Email — see below) | Every one renders a subject, HTML and text, escapes what a stranger typed, and never prints "undefined" |
| P8.3 | BullMQ queue with retries | `done` | A failed send is recorded and rethrown so the queue retries; the log row tells the truth after the retry |
| P8.4 | `email_log` + admin view | `done` | `/admin/emails`, filterable by status and template, with the day's headroom |
| P8.5 | "Send mail as" alias setup | `done` (documented) | `MAIL_FROM` plus the Gmail alias steps in `.env.example` — the alias must be verified in Gmail or it rewrites the From header |
| P8.6 | Daily-volume monitor | `done` | Ordinary mail is suppressed at the limit and logged as such; a password reset goes anyway |

### Phase 8 notes

- **Templates are functions, not React Email components** — a deviation from the approved
  plan, and a deliberate one. These are eleven static single-column messages; rendering them
  with React would put a JSX toolchain and a renderer inside the API process to produce
  output identical to the strings we now have. Each template is a pure function and is unit
  tested directly. Say the word if React Email is wanted anyway and it is a contained change.
- **The log row is written before the job is queued.** A message that is never delivered is
  still a message somebody can find and re-send. The job id *is* the log id, so a redelivery
  lands on the same row rather than sending twice.
- **Critical mail ignores the daily ceiling.** Verification, password reset and the
  password-changed notice go out even at the limit: locking someone out of their own account
  to protect a quota is the wrong trade. Everything else is suppressed and recorded.
- **A gap the tests found:** the dedupe index existed only in the migration, so on any
  machine where migrations had not run it did not exist at all — and `QueuedMailer` was
  catching a duplicate-key error that would never arrive. It is now declared on the schema as
  well, which is what the property indexes already do.
- **CI now runs a real Redis.** The email queue is the path every notification takes in
  production, and a queue test skipped in CI proves nothing.

**Before launch:** create the Gmail app password and, if mail should come from
`info@locatex.in` rather than the Gmail address, verify that alias under Gmail →
Settings → Accounts → "Send mail as". Gmail rewrites the From header otherwise.

## Phase 8b — Account access · `done`

Not in the original plan. The plan assumed the template's login and register modals were
functional; they were markup with `onSubmit={preventDefault}`. Everything built in Phases 2,
5 and 7 was unreachable from a browser until this was done.

| # | Task | Status | Verified by |
| --- | --- | --- | --- |
| P8b.1 | Sign-in modal wired, email or mobile as the identifier | `done` | A wrong password and an unknown account give the same message — the server does not distinguish them either |
| P8b.2 | Registration modal with the brief's fields and the two-channel confirmation step | `done` | The form no longer closes on success: it shows what still has to be confirmed, because a "registered!" that then refuses the sign-in reads as a broken site |
| P8b.3 | `/verify-email` and `/reset-password` pages | `done` | Both are in the deployable check — a 404 there would break every confirmation link ever sent |
| P8b.4 | Session-aware header with sign-out | `done` | Driven by the session, not by the layout; the template showed "Sign in" to signed-in visitors on every public page |
| P8b.5 | Forgot-password flow | `done` | The same response whether or not the address has an account |

### Phase 8b notes

- **The email confirmation spends its token on mount, the password reset does not.** Clicking
  the link in the email *was* the intent, so asking for a second click only loses people. A
  reset is different: spending the token on open would burn the link if the phone locked
  before a password was typed.
- **Confirmation runs once even though React mounts effects twice in development.** The
  second run would find the token already spent and report a failure for something that
  worked.
- A new `signupJourney` suite drives the API in the exact order the modal does. The other
  suites use a helper that shortcuts registration, which would hide a mismatch between what
  the form sends and what the API expects.

## Phase 9 — Buyer features · `done`

| # | Task | Status | Verified by |
| --- | --- | --- | --- |
| P9.1 | Favourites, server-side | `done` | Saved on one device and read on another; saving twice is saving once, enforced by a unique index rather than by the interface |
| P9.2 | Contact unlock + audit | `done` | One row per buyer per listing per day; never for a visitor, who is not shown the number, and never for the broker reading their own listing |
| P9.3 | Enquiries | `done` | The broker is emailed with a number they can ring; a buyer cannot repeat the same question all afternoon |
| P9.4 | Buyer dashboard | `done` | `/my-favorites` and `/my-enquiries`, the latter showing both sides of the same records |

### Phase 9 notes

- **The unlock is keyed by the day.** Without that, a buyer refreshing a page ten times
  would look like ten interested people and the number a broker sees would mean nothing.
- **Saved listings that have since been withdrawn are counted, not dropped.** A list that
  quietly shrinks makes people think the site lost their data, when a plot was simply sold.
- **A bug this phase introduced, and the test that now prevents it.** Mounting the buyer
  routes at `/api/v1` with a blanket `requireUser` guarded *everything* under that prefix —
  the public contact form and the news endpoint started returning 401. The routers are now
  at `/api/v1/me` and `/api/v1/broker`, the enquiry POST sits with the listing it is about,
  and a test asserts that every public endpoint stays public and every private one stays
  private.
- Favourite state is held once for the whole app rather than per card; a grid of
  twenty-four cards would otherwise make twenty-four requests to draw twenty-four hearts.

## Phase 10 — Chat · `done`

| # | Task | Status | Verified by |
| --- | --- | --- | --- |
| P10.1 | Thread + message models | `done` | One conversation per (listing, buyer), enforced by a unique index so two taps cannot split the history |
| P10.2 | Socket.IO with cookie auth | `done` | Reuses the session cookie and repeats the HTTP middleware's checks, so a suspended account cannot hold a live socket |
| P10.3 | REST mirror + polling fallback | `done` | HTTP *is* the feature; the socket only pushes a copy. 18 tests exercise the REST path end to end |
| P10.4 | Read receipts and unread badges | `done` | Reading a thread is what marks it read — no separate call to forget, and no receipt that depends on the client remembering |
| P10.5 | 24-hour unread digest | `done` | One email per person gathering every ignored conversation; a week of silence is one email, not seven |
| P10.6 | Rate limits, report and block | `done` | 20 messages a minute, counted from the messages so a restart does not reset it. **Contact details are not masked** — the client's decision |

### Phase 10 notes

- **HTTP is the transport; the socket is an accelerator.** A chat built socket-first is
  broken for exactly the people on the worst connections — who, here, are standing in a
  field. Without a socket the client polls every eight seconds and loses nothing but
  immediacy.
- **A conversation is private from an administrator too.** A non-participant gets a 404
  rather than a 403, because whether a conversation exists is itself private.
- **Blocking silences the backlog, not just what comes next.** Writing the tests caught
  this: the message that made someone block was still sitting unread in their inbox, and the
  digest would have emailed them about it a day later — the exact thing they had just asked
  to stop.
- **The digest runs hourly, not daily.** Each message has its own 24-hour clock, so a single
  daily run would be 24 hours late in the best case and 48 in the worst.
- **Contact details are stored exactly as typed.** A pattern that hides phone numbers also
  hides survey numbers, khaata numbers and prices — all of which look alike to a regular
  expression, and all of which are the point of the conversation.

## Phase 11 — Public pages · `done`

| # | Task | Status | Verified by |
| --- | --- | --- | --- |
| P11.1 | Listing grid and list | `done` | `/properties`, with filters, sorting and cursor paging |
| P11.2 | Map view | `done` | Same page, `?view=map`; exact pins are markers, approximate ones are circles |
| P11.3 | Property detail with pin or circle by precision | `done` | `/properties/:id`; the guest response has no exact price, contact, survey number or real pin, so there is nothing in the page to find with a console |
| P11.4 | Broker profiles | `done` | `/brokers/:id` — contact details only for signed-in visitors, counts across all their listings rather than the page shown |
| P11.5 | Contact page wired to the API | `done` | Done in Phase 7 |
| P11.6 | Tools and news | `partial` | The news endpoint is live and the admin manages items; the area converter and EMI calculator on the home page are still the template's |

### Phase 11 notes

- **Filters live in the URL, not in component state.** A property search gets sent to a
  spouse, bookmarked and reached with the back button; none of that works if the state is
  only in React.
- **`view` is stripped before the query reaches the API.** The search schema is `.strict()`,
  so a stray parameter is a 400 rather than a value quietly ignored — good discipline, but
  it means our own view parameter had to be kept out of the request. A deployable check now
  covers a filtered search so a regression here is caught before a deploy.
- **Approximate listings are drawn as circles, not markers.** A marker asserts "here", and
  the one thing known about these is that we do not know exactly where.
- **The template's demo listing pages are left alone.** `/sidebar-grid`, `/topmap-grid` and
  the rest still render their sample data; they are reference material. The navigation now
  points at the real pages.

## Phase 12 — Hardening & launch · `todo`

P12.1 security review · P12.2 accessibility pass · P12.3 load check on search and uploads ·
P12.4 staging → production, cookie domains · P12.5 backups and alerts · P12.6 v1 data
migration

---

## Deferred / parked

| Item | Why parked |
| --- | --- |
| Plot boundary polygons | Post-launch; the `boundary` field exists from day one so no migration is needed. |
| Gujarati UI | Awaiting a decision; strings are kept out of components to make it cheap later. |
| Storage upgrade (Google One) | Client declined. Mitigated by documents-only-to-Drive and the quota monitor. |
