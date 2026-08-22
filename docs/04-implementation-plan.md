# LocateX v2 — Implementation plan & tech stack

Companion to `00-requirements-analysis.md` … `03-technical-spec.md`. This document answers
the build questions: **which stack, for which part, and in what order** — with the
requirements added in this round folded in (Google Drive on the owner's account, email
flows, Gujarat address → map pin, JWT auth, four role dashboards, chat, favourites,
profile management, contact-us handling).

Legend: **[Confirmed]** client-stated · **[Existing]** reusable from v1 · **[Recommended]**
our proposal · **[Decision]** needs your answer before that phase starts.

---

## 1. Tech stack — the recommendation

| Layer | Recommended | Why this, over the alternatives |
| --- | --- | --- |
| **Frontend** | React 19 + Vite + **TypeScript**, existing LocateX theme CSS | Already built and branded. TS is added incrementally (`allowJs`) so the working home page never stops working. Next.js would buy SEO/SSR but forces a rewrite of the theme integration and a Node host for the frontend — revisit only if organic search becomes the priority. |
| **Server state** | TanStack Query | Gives loading/error/empty states, caching and retries for free — the four dashboards are almost entirely server state. Redux/Zustand would add a store we do not need. |
| **Forms** | React Hook Form + Zod resolver | The submit-property wizard has ~30 fields across 5 steps; RHF keeps re-renders local and Zod schemas are shared with the backend. |
| **API runtime** | Node 22 + **TypeScript** + **Express 5** | Team already knows Express; v1 is Express. Express 5 handles async errors natively. Business logic stays framework-free, so swapping is cheap. *NestJS* = more structure, steeper ramp; *Fastify* = faster, but the speed is irrelevant at this volume. |
| **Database** | **PostgreSQL + Prisma** | The domain is relational: properties → applications → documents → audit, chat threads → messages → read receipts, users → roles → profiles. Postgres gives real constraints, transactions, migrations and PostGIS-ready geo queries. *MongoDB* (v1's) is the alternative — cheaper migration, but v1's silent-field-drop bugs came exactly from schemaless writes. |
| **Geo queries** | PostGIS extension (or `earthdistance` to start) | "Listings within 25 km of this pin" is a launch-day filter for a land marketplace. |
| **Cache + jobs** | Redis + **BullMQ** | Needed anyway for the email queue, the 24-hour unread-chat scan, Drive retries and rate limiting. |
| **Realtime chat** | **Socket.IO** in the same Node process, Redis adapter when we scale out | Broker↔buyer chat needs delivery + read receipts + presence. *SSE + REST* would work and is simpler, but read receipts and typing indicators need a second channel anyway. *Polling* is the fallback we keep for restrictive networks. |
| **File storage** | **Google Drive** (site owner's account) behind a `DocumentStorage` interface | Client requirement. The interface means an S3/R2 move later is a new adapter, not a rewrite. |
| **Image delivery** | Drive as the vault + **thumbnail cache** (Cloudinary, already in v1, or R2) | Drive is not a CDN: shared-link downloads are throttled, slow and quota-limited. Originals live in the owner's Drive; the site serves cached, resized copies. |
| **Email** | **Brevo** or **Amazon SES** + **React Email** templates | Both deliver well from India and are cheap at this volume; SES is cheapest at scale, Brevo is quicker to set up. Nodemailer/SMTP stays as the driver so the provider is one env var. |
| **Maps** | Google Maps JS API + Places Autocomplete + Geocoding | Already the client's world (v1 loads it), and the plot-pin UX benchmarked at DekhoJamin is Google-based. |
| **Auth** | **JWT** in httpOnly cookies, rotating refresh | Client requirement is JWT — this *is* JWT, just not stored where JavaScript (and XSS) can read it. See §4. |
| **Hosting** | API on Render/Railway/Fly · Web on Vercel · Postgres on Neon/Supabase · Redis on Upstash | Keep API and web under `*.locatex.in` so the session cookie stays first-party. |
| **Tooling** | pnpm workspace, ESLint + Prettier, Vitest, Playwright, GitHub Actions | Shared `packages/contracts` keeps frontend and backend types in sync. |

### 1.1 Three approaches, and why not the other two

| | **A. Node + TS + Postgres** ← recommended | **B. Lean: Node + TS + MongoDB** | **C. Next.js full-stack on serverless** |
| --- | --- | --- | --- |
| API | Express 5 + TypeScript | same | Next.js route handlers |
| Data | PostgreSQL + Prisma | MongoDB Atlas + Mongoose + Zod (v1's database) | Postgres (Neon) + Prisma |
| Chat | Socket.IO in the same process | REST + 10 s polling | ✗ serverless has no long-lived connections — needs Ably/Pusher |
| Background jobs | BullMQ + Redis worker | `node-cron` in-process | ✗ needs Inngest/QStash; a 24-hour delayed job is awkward |
| Drive uploads | Long-running resumable uploads fine | fine | ⚠ function timeouts fight large uploads |
| Images | Drive + CDN thumbnail cache | Drive only, accepted slowness | Drive + CDN |
| Effort | ~14–16 weeks | ~9–11 weeks | ~12–14 weeks + two extra vendors |
| Risk | Team learns Prisma/Postgres | Weak schema guarantees — v1's silent-field-drop bug class returns | Chat and jobs both need third-party services |

**Recommendation: A.** Chat, delayed email jobs and resumable Drive uploads all want a
persistent process, which is what rules out C. Between A and B, the deciding factor is that
v1 lost every uploaded document precisely because a schemaless write silently dropped
fields the schema did not declare — the relational model makes that failure impossible.

Everything below assumes **A**.

---

## 2. Roles and dashboards

Four roles **[Confirmed]**, each with its own dashboard built from the theme's existing
dashboard layout.

| Role | Auth | Dashboard contents |
| --- | --- | --- |
| **Viewer** (guest) | none | No dashboard. Sees listings with **price range**, photos, district/taluka/village and an **approximate map circle**. Broker phone/email hidden behind a "Log in to see contact" CTA. |
| **Buyer** | JWT session | *Saved land* (favourites) · *My enquiries* · *Chats* with brokers · *Profile* (photo, password, preferred district, budget) · *Contact unlock* history |
| **Broker** | JWT session + admin verification | *My listings* with status pills (draft / pending / approved / rejected / sold) · *Post land* wizard · *Enquiries received* · *Chats* with buyers · *Documents* per listing · *Profile* (agency, RERA, office address, photo, password) |
| **Admin** | JWT session, role checked server-side | *KPIs* (active listings, pending approvals, total buyers, sold) · *Approval queue* with document viewer, approve/reject + reason · *Users* (activate/deactivate, change role, verify brokers) · *Contact-us inbox* · *Chat oversight* (read-only) · *News/ads* with start/end dates · *Email log* |

Enforcement is server-side in three places — route guard (role), use-case policy (ownership),
serializer (field redaction). The client mirrors it for UX only.

### 2.1 Price range shown to viewers

The requested formula, corrected: `min(0, …)` always yields 0 for a positive price, so it
reads as **`max(0, …)`**. **[Decision — confirm]**

```ts
export function priceRange(paise: bigint) {
  const value = Number(paise);
  return {
    low:  Math.max(0, Math.round(value * 0.9)),   // −10%
    high: Math.round(value * 1.1),                // +10%
  };
}
// ₹72,00,000 → a viewer sees "₹64.80 L – ₹79.20 L"
```

Computed **on the server**, inside the public serializer. The exact figure never enters a
guest response, so it cannot be read out of the network tab.

---

## 3. Gujarat address, and putting it on the map

The requirement: collect state → district → taluka → village → pincode, and show the
property on Google Maps **exactly, or approximately from the pincode**.

### 3.1 No reliable third-party API exists for this — so we own the data **[Recommended]**

What was actually tested while writing this plan:

| Source | What it gives | Verdict |
| --- | --- | --- |
| **India Post API** (`api.postalpincode.in/pincode/{pin}`) | Free, no key. Returns post offices with District, Block (≈ taluka), State. Tested `363641` → 35 post offices, Block "Morbi". | Useful as a **pincode validator/helper**, but the district data is stale (still files Morbi under Rajkot, a 2013 split) and there is no cascading query. |
| **GeoNames postal dump** (`download.geonames.org/export/zip/IN.zip`, CC-BY 4.0) | Free bulk download. Tested: **8,917 Gujarat rows · 1,026 pincodes · 27 districts · 344 talukas · 7,772 place names — every row with latitude/longitude.** | **The coordinate source.** Coverage is partial (Gujarat now has 33 districts and ~1,800 pincodes), so it supplements rather than replaces official data. |
| **LGD** (Local Government Directory, lgdirectory.gov.in) | Official, current state/district/sub-district/village names and codes | **The naming/hierarchy source** — CSV export, seeded into our tables. No open API, which is exactly why we seed. |

**Conclusion:** we seed our own reference tables and expose our own cascading endpoints. No
third-party call happens while a broker fills the form, so the wizard never stalls on someone
else's rate limit or outage.

```text
GET /api/v1/reference/districts                → 33 Gujarat districts
GET /api/v1/reference/talukas?district=morbi   → talukas in that district
GET /api/v1/reference/villages?taluka=maliya   → villages, with pincode + centroid
GET /api/v1/reference/pincode/363641           → { district, taluka, villages[], centroid, radiusKm }
```

Tables `gj_district`, `gj_taluka`, `gj_village`, `gj_pincode` — each with its LGD code, name
(English + Gujarati where available), parent id, `centroid geography(Point)` and
`updated_at`. A quarterly job re-checks LGD for administrative changes.

### 3.2 Location precision — exact pin or approximate circle

```text
Broker fills the form
   │
   ├─ drops a pin on the map (default, encouraged)   → precision = EXACT
   │     Places Autocomplete biased to the chosen taluka; draggable marker;
   │     "use my current location" for when they are standing on the plot
   │
   └─ skips the pin                                   → precision = APPROX
         village centroid → else taluka centroid → else pincode centroid
         (from our seeded tables; the Geocoding API only as a last resort)
```

Stored on the property:

```ts
latitude, longitude       // always present
locationPrecision         // 'exact' | 'approx'
accuracyRadiusM           // 0 for exact; ~2–8 km for a pincode centroid
locationSource            // 'pin' | 'village' | 'taluka' | 'pincode' | 'geocode'
```

**Rendering rule:** `exact` draws a marker; `approx` draws a translucent circle of
`accuracyRadiusM` labelled "Approximate location — exact pin shared by the seller". Measured
example: pincode 363641 spans roughly 46 km × 27 km across 33 places, so a raw pincode
centroid is genuinely coarse. Showing a circle is honest; showing a pin would not be.

**[Decision]** Do guests see the exact pin at all? Recommendation: everyone sees the circle
for `approx` listings, and the **exact pin unlocks together with the contact details on
login** — consistent with the paywall the brief already defines.

Later (not v1 scope): the boundary polygon we saw at DekhoJamin. The `boundary jsonb` column
exists from day one so adding it never needs a migration of existing rows.

---

## 4. Authentication — JWT, stored safely

**[Confirmed]** JWT. **[Recommended]** where it lives:

```text
POST /auth/login
  ← Set-Cookie: lx_at=<JWT>     HttpOnly; Secure; SameSite=Lax;     15 min
  ← Set-Cookie: lx_rt=<opaque>  HttpOnly; Secure; SameSite=Strict;  30 days, path=/api/v1/auth
  ← Set-Cookie: lx_csrf=<rand>  (readable, mirrored in X-CSRF-Token on writes)
```

- The access token is a signed JWT carrying `sub`, `role`, `jti`, 15-minute expiry.
- The refresh token is opaque, stored hashed and **rotated** on every use; replaying an old
  one revokes the whole family (theft detection).
- `POST /auth/logout` revokes the family and clears the cookies — v1's logout did nothing at all.
- Why not `localStorage`: any XSS reads the token and it stays valid until expiry. v1 stored
  it under three different keys in `localStorage`; that class of bug ends here.
- A native app later can be issued the same JWT as a bearer token from a separate
  `/auth/token` endpoint, without changing the web flow.

Registration collects the brief's fields — buyer: name, email, phone, preferred
city/district, budget range; broker: name, agency, phone, email, office address, RERA
(optional). Email verification link and phone OTP are both supported; **[Decision]** which is
mandatory at signup.

---

## 5. Google Drive on the site owner's account

### 5.1 Connecting the owner's Drive **[Recommended]**

```text
Admin → Settings → Storage → "Connect Google Drive"
   → Google consent screen (the owner's own account, scope drive.file)
   → we store the refresh token, encrypted, server-side
   → every upload from then on lands in that account's Drive
```

This is **OAuth on the owner's account**, chosen because the requirement is literally "the
Drive of the site owner". The alternative — a service account writing into a **Shared
Drive** — is more robust (files belong to the organisation, no individual's quota, key
rotation instead of a refresh token) but needs **Google Workspace**. **[Decision]** Do you
have Workspace on `locatex.in`? If yes, the Shared Drive is the better design; the adapter
supports both and it is a config switch.

Scopes, least privilege:

| Scope | Used for | Why not more |
| --- | --- | --- |
| `drive.file` | Create/read/update **only files this app creates** | `drive` (full) would expose every unrelated file in the owner's Drive. We create every folder we touch and store its ID, so `drive.file` is sufficient. |
| `openid`, `email`, `profile` | Recording which account was connected | Nothing else is read. |

The refresh token is encrypted at rest, never leaves the backend and is never sent to the
browser. If the owner revokes access, uploads fail loudly with a banner in the admin
dashboard rather than silently dropping files — which is v1's actual failure mode today.

### 5.2 Folder layout

```text
LocateX Storage/                    (root folder id in env)
└── 2026/
    └── PROP-01JB2X3Y4Z/            (property ULID — never the title)
        ├── documents/              7-12, 8A, Utarotar, NA order, other
        ├── images/                 originals
        └── archive/                superseded versions
```

Every file is recorded in Postgres: `drive_file_id`, `drive_folder_id`, `file_name`,
`mime_type`, `size_bytes`, `sha256`, `category`, `version`, `uploaded_by`, `uploaded_at`.
**Drive is never queried to answer an application question**, and filenames are never
identifiers.

### 5.3 Upload path

```text
1. POST /properties/:id/documents/upload-session
     server checks role + ownership + category + mime + size,
     creates a Drive resumable session, returns { documentId, uploadUri, expiresAt }
2. Browser PUTs the bytes straight to uploadUri — progress, pause/resume, no credentials in JS
3. POST /properties/:id/documents/:documentId/confirm { sha256, size }
     server verifies with Drive, writes the row, emits an audit event
```

Fallback for small files and blocked networks: `POST /properties/:id/documents` multipart,
streamed through the API. A one-day spike gates the direct path (browser → Google CORS).

Limits and safety: images ≤10 MB, documents ≤25 MB, 10 documents per property, magic-byte +
extension checks, `sha256` dedupe, nightly cleanup of abandoned sessions, exponential backoff
on Drive 429/5xx, and every Drive call through BullMQ so an outage never fails a user request.

---

## 6. Email flows

One `Mailer` interface, templates as React Email components using the LocateX palette, logo
and footer. Every send is queued, retried with backoff, and written to an `email_log` table
(recipient, template, entity, status, provider id) that the admin can read.

| # | Trigger | To | Template | Notes |
| --- | --- | --- | --- | --- |
| 1 | Contact-us form submitted | **Admin** | `contact-received` | Full message + link to the admin inbox row |
| 2 | Contact-us form submitted | Sender | `contact-acknowledged` | "We have your message and reply within X hours" |
| 3 | Broker submits a property | **Admin** | `property-submitted` | Title, district, area, price + one-click link to the approval queue |
| 4 | Admin approves | **Broker** | `property-approved` | Live link to the public listing |
| 5 | Admin rejects | **Broker** | `property-rejected` | **Carries the rejection reason** + edit-and-resubmit link |
| 6 | Buyer enquires / unlocks contact | Broker | `new-enquiry` | Buyer name, phone, message, property |
| 7 | **Chat message unread for 24 h** | Recipient | `unread-messages` | One digest per recipient, threads grouped, deep link |
| 8 | Registration | User | `verify-email` | Signed token, 24 h |
| 9 | Forgot password | User | `reset-password` | Hashed token, 10 min (v1 behaviour kept) |
| 10 | Broker verified / rejected | Broker | `broker-verification` | |
| 11 | Admin composes a message | Broker / buyer | `admin-message` | The brief's "admin can email brokers and users" |

### 6.1 The 24-hour unread rule

```sql
-- hourly job
SELECT recipient_id, thread_id, count(*)
FROM chat_message
WHERE read_at IS NULL
  AND notified_at IS NULL
  AND created_at < now() - interval '24 hours'
GROUP BY recipient_id, thread_id;
```

Send **one digest per recipient** (never one mail per message), then stamp `notified_at` so
nobody is emailed twice about the same message. A `notification_preferences` row lets people
turn it off.

---

## 7. Chat between broker and buyer

- `chat_thread` — `(property_id, buyer_id, broker_id)` unique; a thread always hangs off a
  property, so context is never lost.
- `chat_message` — `thread_id, sender_id, body, attachments jsonb, created_at, delivered_at,
  read_at, notified_at`.
- Transport: **Socket.IO**, JWT cookie authenticated on the handshake, rooms keyed by thread
  id. Events: `message:send`, `message:new`, `message:read`, `typing`, `presence`.
- REST mirrors everything (`GET /threads`, `GET /threads/:id/messages?cursor=`,
  `POST /threads/:id/messages`) so history, deep links and the polling fallback all work.
- A buyer may only open a thread on a property whose contact they have unlocked — chat sits
  behind the same paywall as the phone number.
- Abuse controls: per-user rate limits, block/report, admin read-only oversight, and
  phone/email masking in message bodies **[Decision]** — do you want contact swapping inside
  chat allowed or masked?

---

## 8. Property form — fields carried from v1

**Amenities [Existing — exact values from v1]:** `fencing` "Fencing / Boundary Wall" ·
`house` "House on Land" · `electricity` "Electricity Connection" · `kuvo` "Kuvo" ·
`underground_pipeline` "Underground Pipeline"

**Disadvantages [Existing]:** "Underground Cable / Line" · "Borewell / Well" ·
"Passing Vijpool" · "Passing Canal"

Both move out of hard-coded HTML into `reference_amenity` / `reference_disadvantage` tables
so an admin can extend them without a deploy. Proposed additions **[Decision]**: road access
(kaccha / pakka / highway), water source (canal / borewell / well / none), soil type, fencing
type, distance from highway, electricity connection type.

The rest of the wizard, its validation rules and the five-step order are specified in
`02-ui-spec.md` §2.

---

## 9. The remaining requested features

| Feature | Design |
| --- | --- |
| **Favourites / liked property** | `favorite(user_id, property_id)` table, buyer-only. `POST`/`DELETE /properties/:id/favorite`, `GET /favorites`. Optimistic heart toggle. Replaces v1's localStorage-only list, so it follows the user across devices. |
| **Profile image** | `POST /me/avatar` → thumbnail cache, not Drive (avatars are hot, small and public). 2 MB cap, square crop in the browser before upload. |
| **Password update** | `PATCH /me/password` with a current-password check; all other sessions revoked on success; confirmation email. |
| **Contact-us** | `POST /contact` (public, rate-limited, honeypot + reCAPTCHA) → `contact_message` row → admin inbox with `new / read / replied / closed` → emails #1 and #2. Admin replies from the dashboard and the reply is logged against the row. |
| **Admin news/ads** | `news_item` with `starts_at` / `ends_at`; the home page section already renders from this shape. |
| **KPIs** | `GET /admin/stats` — active listings, pending approvals, total buyers, properties sold: the four the brief names. |

---

## 10. Theme and UI consistency

Everything new is built from components already in the app — `PropertyCard`, `NiceSelect`,
`RangeSliderWidget`, `SectionHeader`, the dashboard layout, the icomoon icon set and the
theme's `styles.css` tokens. The new primitives (`Skeleton`, `EmptyState`, `ErrorState`,
`StatusPill`, `FileDropzone`, `StepNav`, `ChatBubble`, `MapPicker`, `PriceDisplay`,
`ContactLock`) are added in the same visual language, so the four dashboards read as one
product rather than four bolted-on screens.

---

## 11. Phases

Each phase ends with something demonstrable and independently verifiable. Estimates assume
one full-time developer; frontend and backend can be parallelised to compress.

| # | Phase | Deliverable | Verification | Est. |
| --- | --- | --- | --- | --- |
| 0 | **Decisions & spike** | Answers to every **[Decision]**; Drive CORS spike; Workspace confirmed | Written sign-off | 3 d |
| 1 | **Foundations** | pnpm workspace, TS, Postgres + Prisma, Redis, CI, error model, logging, `packages/contracts` | `pnpm test` green, `/healthz` green in staging | 1 w |
| 2 | **Auth & roles** | Register / login / refresh / logout, cookie JWT, CSRF, 4 roles, guards, email verify, password reset | RBAC matrix integration test — one case per cell | 1.5 w |
| 3 | **Reference data** | LGD + GeoNames seeded, `/reference/*` cascade, pincode lookup + centroids | Cascade works for all 33 districts; `363641` returns Morbi taluka + centroid | 1 w |
| 4 | **Property core** | Model, lifecycle state machine, CRUD, search with filters + geo radius, public vs authenticated serializers, **price-range redaction** | Guest response provably contains no contact and no exact price | 1.5 w |
| 5 | **Submit wizard** | 5-step form, server-side draft, validation, **map pin picker + approx fallback** | A broker posts land from a phone; pin and precision stored correctly | 2 w |
| 6 | **Drive integration** | Owner OAuth connect, folder strategy, resumable upload, confirm, versioning, retries, admin storage banner | 25 MB PDF uploads and resumes after a killed connection; row and Drive file match | 1.5 w |
| 7 | **Approval & admin dashboard** | Queue, document viewer, approve/reject with reason, users, verification, KPIs, news/ads, contact inbox | Full submit → approve → public loop with audit rows | 1.5 w |
| 8 | **Email system** | Mailer, queue, all 11 templates, `email_log`, preferences | Each trigger sends exactly one mail; retries survive a provider outage | 1 w |
| 9 | **Buyer features** | Favourites, contact unlock, enquiries, buyer dashboard | Unlock writes an audit row; favourites persist across devices | 1 w |
| 10 | **Chat** | Socket.IO, threads, receipts, history, polling fallback, **24 h unread digest** | Two browsers exchange messages live; the digest fires once and never twice | 1.5 w |
| 11 | **Broker dashboard & profile** | Listings with statuses, enquiries, avatar, password, agency/RERA | A broker completes every self-service action without support | 1 w |
| 12 | **Hardening** | Rate limits, headers, file scanning, idempotency, load test, accessibility pass | Security checklist signed off | 1 w |
| 13 | **Launch readiness** | Staging → production, backups, runbook, monitoring, v1 data migration | Restore drill; an alert fires on a killed worker | 1 w |

**≈15 weeks** sequential, ≈10–11 with a second developer on the frontend from phase 4.

Client-facing milestones: **M1** end of phase 2 (people can register and sign in) ·
**M2** end of phase 7 (a broker posts land, an admin approves it, the public sees it) ·
**M3** end of phase 10 (buyers save, unlock, enquire and chat) · **M4** launch.

---

## 12. Decisions needed before phase 1

1. Google **Workspace** on `locatex.in`? → decides Shared Drive vs owner-OAuth.
2. Confirm the price range reads `max(0, value − 10%)` … `value + 10%`.
3. Do guests ever see the **exact** pin, or only the approximate circle until login?
4. Which property documents are **mandatory** before a listing may be submitted?
5. Signup verification: email link, phone OTP, or both?
6. May buyers and brokers exchange phone numbers **inside chat**, or should they be masked?
7. Confirm that brokers alone may list (the v1 site says "no middlemen"; the brief says brokers list).
8. English-only UI, or Gujarati as well?
