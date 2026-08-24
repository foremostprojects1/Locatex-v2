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
| **Current phase** | Phase 5 — Submit wizard |
| **Last completed** | Phase 4 — Property core: the listing model, the lifecycle state machine, search with keyset pagination and radius queries, and role-aware serialisation (95 API + 40 contract tests green, 13 deployable checks) |
| **Next action** | P5.1 — server-side draft and autosave endpoints |
| **Blocked on** | nothing to code. Two inputs needed before launch: a MongoDB Atlas URI (tests use an in-memory replica set, so development is unblocked) and an **SMS provider for phone OTPs** — see the note under Phase 2 |

**To resume:**

```bash
cd Loca/locatex
pnpm install
pnpm test                     # 135 tests should pass
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

## Phase 5 — Submit wizard · `todo`

| # | Task | Verify by |
| --- | --- | --- |
| P5.1 | Server-side draft + autosave endpoints | Draft survives a browser restart |
| P5.2 | Five-step wizard UI on the LocateX theme | Broker completes it on a phone |
| P5.3 | Shared zod validation (contracts package) | Same errors client and server |
| P5.4 | Map pin picker + approximate fallback + precision recording | Pin, precision and radius stored correctly |
| P5.5 | Amenities / disadvantages / new attributes in the form | Values persist |

## Phase 6 — Google Drive · `todo`

| # | Task | Verify by |
| --- | --- | --- |
| P6.1 | `DocumentStorage` interface + in-memory fake for tests | Use cases test without Google |
| P6.2 | Admin "Connect Google Drive" OAuth flow, encrypted refresh token | Reconnect after revoke works |
| P6.3 | Folder strategy + metadata records | Folder ids stored, never searched by name |
| P6.4 | Resumable upload session + confirm + versioning/archive | 25 MB PDF resumes after a killed connection |
| P6.5 | **Quota monitor + 80% admin banner** (no storage upgrade — 15 GB only) | Alert fires in a simulated test |
| P6.6 | Documents only to Drive; images to the CDN | Verified by upload paths |

## Phase 7 — Approval & admin · `todo`

P7.1 approval queue · P7.2 document viewer · P7.3 approve/reject with reason ·
P7.4 users: activate/deactivate, verify brokers · P7.5 KPI cards · P7.6 news/ads with
start/end · P7.7 contact-us inbox

## Phase 8 — Email · `todo`

P8.1 `Mailer` interface + Gmail SMTP adapter (app password) · P8.2 React Email templates ×11 ·
P8.3 BullMQ queue with retries · P8.4 `email_log` + admin view · P8.5 "Send mail as" alias
setup · P8.6 daily-volume monitor against the ~500/day cap

## Phase 9 — Buyer features · `todo`

P9.1 favourites (server-side) · P9.2 contact unlock + audit · P9.3 enquiries ·
P9.4 buyer dashboard

## Phase 10 — Chat · `todo`

P10.1 thread + message models · P10.2 Socket.IO with cookie auth · P10.3 REST mirror +
polling fallback · P10.4 read receipts and unread badges · P10.5 **24-hour unread digest job**
· P10.6 rate limits and report/block (**contact swapping is allowed — no masking**)

## Phase 11 — Public pages · `todo`

P11.1 listing grid/list · P11.2 map view · P11.3 property detail (pin/circle by precision) ·
P11.4 broker profiles · P11.5 contact page wired to the API · P11.6 tools and news

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
