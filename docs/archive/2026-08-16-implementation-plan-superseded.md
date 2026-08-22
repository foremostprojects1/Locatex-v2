# LocateX v2 — Implementation plan & tech stack (Deliverable D)

Companion documents: `00-requirements-analysis.md`, `01-architecture.md`, `02-ui-spec.md`,
`03-technical-spec.md`. This document adds the decisions requested after the first review:
tech stack per approach, Google Drive uploads into the **site owner's** Drive, the email
flows, Gujarat address capture with a map pin, JWT auth, four role dashboards, chat between
broker and buyer, and the smaller account features.

---

## 1. Tech stack — three approaches, one recommendation

| | **A. Node + TypeScript + Postgres** ← recommended | **B. Node + TypeScript + MongoDB** | **C. Next.js full-stack on serverless** |
| --- | --- | --- | --- |
| API | Express 5 + TypeScript (strict) | same | Next.js route handlers |
| Data | PostgreSQL + Prisma | MongoDB Atlas + Mongoose + zod | Postgres (Neon) + Prisma |
| Why | Relational integrity for property → application → documents → audit; migrations; exact money as `bigint` paise; strong reporting for admin KPIs | Team already runs Atlas in v1; zero migration work; fastest start | One deploy, one repo, good DX |
| Chat | Socket.IO in the same process | same | ✗ serverless has no long-lived connections — needs Ably/Pusher |
| Background jobs | BullMQ + Redis worker | same | ✗ needs Inngest/QStash; 24-hour delayed jobs are awkward |
| Drive uploads | Long-running resumable uploads fine | same | ⚠ function timeouts fight large uploads |
| Ops cost | One container + Postgres + Redis | One container + Atlas + Redis | Lowest, until chat and jobs force extra services |
| Risk | Team learns Prisma/Postgres | Weak schema guarantees; v1's silent-drop bug class returns | Two extra vendors for chat and jobs |

**Recommendation: A.** Chat, delayed email jobs and Drive uploads all want a persistent
process, which rules out C. Between A and B the deciding factor is that v1 lost uploaded
documents precisely because the schema silently dropped unknown fields — with money,
approval state and legal documents in play, a typed relational schema with migrations is
worth the learning curve. **If the timeline is the binding constraint, B is acceptable** and
nothing else in this plan changes: the repository interfaces stay identical.

### Full stack, as recommended

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + Vite (the existing LocateX template), React Router 7, TanStack Query, React Hook Form + zod, Socket.IO client |
| API | Node 22, Express 5, TypeScript strict, zod at every boundary, layered (routes → controllers → use cases → domain → repositories → infrastructure) |
| Database | PostgreSQL 16 + Prisma (migrations, `bigint` paise, `jsonb` for boundaries) |
| Cache / queue | Redis + BullMQ (emails, Drive retries, 24-hour unread-chat jobs, cleanup) |
| Realtime | Socket.IO (WebSocket, auto-fallback to long-polling), authenticated from the same JWT cookie |
| Files | Google Drive (service account → owner's Shared Drive) for documents; Cloudinary for images |
| Email | Nodemailer (SMTP) or Resend, with React Email templates |
| Maps | Google Maps JS (browser, referrer-restricted key) + Google Geocoding (server, IP-restricted key), Nominatim as free fallback |
| Auth | JWT in httpOnly cookies, refresh rotation, CSRF double-submit |
| Testing | Vitest, Supertest + Testcontainers, Playwright |
| Observability | pino JSON logs, request ids, `/healthz`, `/readyz` |

---

## 2. Authentication — JWT, four roles

JWT as requested, delivered in **httpOnly cookies** rather than `localStorage`, because the
token is what unlocks broker contact details and must not be readable by JavaScript.

```
POST /auth/login  →  lx_at   (JWT, 15 min, HttpOnly, Secure, SameSite=Lax)
                     lx_rt   (opaque refresh, 30 days, HttpOnly, Path=/api/v1/auth)
                     lx_csrf (readable, mirrored in X-CSRF-Token on unsafe methods)
```

JWT payload: `{ sub, role, ver }`. `ver` is a per-user token version — bumping it on
password change or admin deactivation invalidates every outstanding token immediately.
Refresh rotates and detects reuse; logout revokes the family for real.

### Roles and dashboards

| Role | Dashboard route | What the dashboard shows |
| --- | --- | --- |
| **Viewer** (registered, read-only) | `/dashboard` | Recently viewed land, saved searches, "unlock contacts — become a buyer" upgrade card, profile |
| **Buyer** | `/dashboard` | Saved (liked) properties, inquiries sent, **chats with brokers**, contact-unlock history, profile |
| **Broker** | `/dashboard` | My listings by status (draft / pending / approved / rejected / sold), views per listing, **chats with buyers**, documents needing attention, post-new-land CTA, profile |
| **Admin** | `/admin` | KPI cards (active listings, pending approvals, total buyers, sold), approval queue, all listings, users + activate/deactivate, **contact-form inbox**, broker applications, news/ads, email log |

One `DashboardLayout` with a role-driven sidebar — the four dashboards share the shell and
differ by widgets, so the design language stays identical.

**Open question:** the requirements document calls Viewer a *guest*. A Viewer account only
makes sense if you want registration before browsing. The plan supports both: guests browse
anonymously and see exactly the same redacted data as a Viewer account.

### Price visibility rule

Guests and Viewers never receive the exact price. The API returns a band:

```ts
lower = Math.max(0, price * 0.9)   // your note said min(0, …) — that would always be 0
upper = price * 1.1
// widen outward so the exact price cannot be recovered:
lower = floorTo(lower, 100_000)    // ₹1 L steps
upper = ceilTo(upper,  100_000)
```

**Important correction:** a plain ±10% band lets anyone compute the exact price as the
midpoint, which defeats hiding it. Rounding both ends outward to ₹1 lakh steps keeps the
band useful and non-invertible. Buyers, brokers and admins get `price` exactly.

---

## 3. Property address, pincode and the map pin

### 3.1 The location API question

There is no single official REST API that returns Gujarat's State → District → Taluka →
Village hierarchy. What actually exists, tested today:

| Source | Verdict |
| --- | --- |
| **LGD — Local Government Directory** (`lgdirectory.gov.in`, Ministry of Panchayati Raj) | ✅ **Authoritative.** Official codes for state, district, sub-district (taluka) and village, downloadable as CSV. No open REST API. |
| **India Post pincode API** (`api.postalpincode.in/pincode/{pin}`) | ✅ Free, no key, verified working. Returns post offices (village names), `Block` (≈ taluka), `District`, `State`. ⚠ Postal districts are stale — pincode 363641 reports District "Rajkot" although Morbi has been its own district since 2013. Good for **suggestions**, not as the source of truth. |
| `data.gov.in` resource APIs | Requires a registered API key; the datasets are LGD exports anyway |
| Commercial geo APIs | Unnecessary cost for a single state |

**Recommended approach — own the data, enrich from APIs:**

1. **Seed** `state`, `district`, `taluka`, `village` tables from the LGD Gujarat export
   (34 districts, ~250 talukas, ~18,000 villages), keeping the official LGD codes.
   Refresh with a quarterly re-import script; the tables are versioned.
2. **Serve** the cascade from our own API — `GET /reference/districts`,
   `/talukas?districtId=`, `/villages?talukaId=` — cached with ETags. Instant, offline-safe,
   and no third-party rate limit on the critical submit path.
3. **Enrich** at submit time: when the broker types a pincode,
   `GET /reference/pincode/{pin}` calls India Post server-side (cached 30 days in Redis and
   Postgres) and returns candidate villages, so the form can pre-select the village and flag
   mismatches — "this pincode usually belongs to Wankaner taluka, you selected Morbi".

### 3.2 From address to a pin on Google Maps

Three levels of precision, stored explicitly:

| `location_precision` | How it is obtained | What the public map shows |
| --- | --- | --- |
| `exact` | Broker drags the marker on the map picker, or uses "current location" while standing on the land | The exact pin |
| `approximate` | Server geocodes `village, taluka, district, Gujarat, pincode` via Google Geocoding | Pin plus a 500 m circle labelled "approximate" |
| `pincode` | Fallback: pincode centroid | A circle covering the pincode area, no pin |

Verified fallback: Nominatim returns a usable centroid **and a bounding box** for Indian
pincodes — `363641 → 22.8117, 70.8319`, bbox ≈ 10 km — so the circle radius comes from real
data rather than a guess. Google Geocoding is primary (accurate, paid); Nominatim is the
free fallback and the local-development default.

Columns: `latitude`, `longitude`, `location_precision`, `accuracy_radius_m`,
`geocode_source`, `geocoded_at`, plus optional `boundary jsonb` for the plot polygon later.

The submit form always shows the map with the geocoded guess already placed and asks the
broker to drag it onto the land — which is how most listings reach `exact` without extra work.

---

## 4. Google Drive — uploads into the site owner's Drive

### 4.1 Ownership

Files belong to a **Shared Drive owned by the LocateX Google Workspace account**, with our
service account added as *Content Manager*. Files then survive staff changes and consume the
organisation's quota rather than a personal 15 GB.

**If there is no Workspace account**, the fallback is OAuth: the owner signs in once at
`/admin/integrations/google`, consents, and we store the refresh token encrypted; uploads
then land in the owner's My Drive. Same interface, one different constructor.

**Scope: `https://www.googleapis.com/auth/drive.file` only** — access limited to files the
app itself creates. Never `auth/drive`. No Google credential of any kind reaches the browser.

### 4.2 Folder layout

```text
LocateX Storage (Shared Drive)
└── 2026/
    └── PROP-01JB2X3Y4Z/            ← property ULID, never the title
        ├── documents/              7-12, 8A, Utarotar, NA order, other
        ├── images/                 originals (the CDN serves derivatives)
        ├── application/            submission snapshot JSON per version
        └── archive/                superseded versions
```

Every file is recorded in `property_document` with `drive_file_id`, `drive_folder_id`,
`category`, `mime_type`, `size_bytes`, `checksum_sha256`, `version`, `status`, `uploaded_by`.
Folder ids are stored when created — we never search Drive by name.

### 4.3 Upload flow

```
1. POST /properties/:id/documents/upload-session  → validates role, category, mime, size;
                                                    creates the Drive resumable session;
                                                    returns { documentId, uploadUri, expiresAt }
2. Browser PUTs the bytes directly to uploadUri     resumable, with progress, no credentials
3. POST /properties/:id/documents/:docId/confirm  → verifies with Drive, persists metadata,
                                                    writes an audit event
```

The fallback path (`POST .../documents`, multipart streamed through the API) stays in the
design for small files and for any client where the direct upload fails. A one-day spike
gates the direct path before Phase 7 starts.

Reliability: 10 MB per image, 25 MB per document, 10 documents per property; magic-byte MIME
sniffing; SHA-256 dedupe; nightly cleanup of orphaned Drive files; exponential backoff on
429/5xx through BullMQ.

**Images:** uploaded to Drive for the owner's records **and** pushed to Cloudinary for
serving. Drive is not a CDN — public listing pages must not depend on it.

---

## 5. Email flows

Queued through BullMQ so no HTTP request ever waits on SMTP. Every send is recorded in
`email_log` (template, recipient, subject, status, provider id, error) and visible to the
admin. Templates are React Email components sharing one LocateX layout — logo, green accent,
plain-text alternative.

| # | Trigger | To | Template | Notes |
| --- | --- | --- | --- | --- |
| 1 | Contact form submitted | Admin | `contact-received` | Full message, sender details, link to the admin inbox |
| 2 | Contact form submitted | Sender | `contact-acknowledged` | "We have your message, we reply within a working day" |
| 3 | Broker submits a property | Admin | `property-submitted` | Title, district, area, price, link to the approval queue |
| 4 | Admin approves | Broker | `property-approved` | Live link to the listing |
| 5 | Admin rejects | Broker | `property-rejected` | **Includes the rejection reason** and an edit-and-resubmit link |
| 6 | Buyer sends an inquiry | Broker | `new-inquiry` | Buyer name and message; contact details per the unlock rule |
| 7 | **Chat message unread for 24 h** | Recipient | `unread-messages` | Digest per conversation — see below |
| 8 | Registration | User | `verify-email` | Token, 24-hour expiry |
| 9 | Forgot password | User | `reset-password` | Token, 10-minute expiry (v1 behaviour kept) |
| 10 | Password changed | User | `password-changed` | Security notice, no link |
| 11 | Broker application decided | Applicant | `broker-approved` / `broker-rejected` | |
| 12 | Admin composes a message | Broker / buyer | `admin-message` | The "email brokers/users" feature from the brief |

### The 24-hour unread-chat email

```
message created
   └─ enqueue "unread-check" job, delay 24 h, jobId = message.id
         └─ on fire:
              if message.read_at is not null           → drop
              if recipient notified in the last 24 h   → drop (no spam)
              else → collect every unread message in that conversation,
                     send one digest, stamp notified_at
```

Idempotent by `jobId`, so redelivery cannot double-send. If the recipient reads the thread
first, the job finds `read_at` set and exits. One digest per conversation per day is the cap.

---

## 6. Chat between broker and buyer

- **Transport:** Socket.IO, authenticated by the same JWT cookie during the handshake.
  Rooms are `conversation:{id}`; membership is checked server-side on join.
- **Persistence:** `conversation` (property_id, buyer_id, broker_id, last_message_at, unique
  on the triple) and `message` (conversation_id, sender_id, body, read_at, notified_at,
  created_at). The socket layer never writes directly — it calls the same `SendMessage` use
  case the REST endpoint uses, so history, validation and the unread job behave identically.
- **REST alongside sockets:** `GET /conversations`, `GET /conversations/:id/messages`
  (cursor paginated), `POST /conversations/:id/messages`, `POST /conversations/:id/read`.
  The UI works without WebSocket; sockets only make it live.
- **Rules:** a conversation always belongs to a property; only the buyer and that property's
  broker may join; the buyer must be logged in (this is a contact-unlock event and is
  audited); admins can read a conversation only through an audited support action.
- **UI:** the existing `message.html` template becomes `/dashboard/messages` — conversation
  list, thread, composer, unread badges, typing indicator, seen ticks.
- **Abuse control:** 20 messages per minute per user, 2,000-character cap, links stripped
  from previews, block/report writes an audit event.

---

## 7. Amenities and disadvantages — from v1

Exactly the vocabulary the existing form uses, now stored as reference rows rather than
hard-coded checkboxes, so an admin can extend the list without a deploy.

**Amenities** — `fencing` Fencing / Boundary Wall · `house` House on Land ·
`electricity` Electricity Connection · `kuvo` Kuvo (open well) ·
`underground_pipeline` Underground Pipeline

**Disadvantages** — Underground Cable / Line · Borewell / Well · Passing Vijpool ·
Passing Canal

*(Note: v1 lists Borewell under disadvantages while treating a Kuvo as an amenity. Kept as
found — confirm with the client whether Borewell should move.)*

Proposed additions for land, to confirm: road touch / frontage width, canal touch, drip
irrigation, TP / NA status, corner plot, well water quality, distance to highway.

---

## 8. Account features

| Feature | Endpoint | Notes |
| --- | --- | --- |
| Update profile | `PATCH /users/me` | Name, phone, city/district, budget (buyer), agency / RERA / office (broker) |
| **Profile image** | `POST /users/me/avatar` | Direct to Cloudinary via a signed upload; 2 MB cap, square crop in the browser; the old asset is deleted |
| **Change password** | `PATCH /auth/password` | Requires the current password; bumps token `ver` so other sessions log out; sends template #10 |
| Forgot / reset password | `POST /auth/forgot-password`, `/auth/reset-password` | Hashed token, 10-minute expiry |
| **Liked properties** | `POST` / `DELETE /properties/:id/favorite`, `GET /favorites` | Server-side, replacing v1's `localStorage`; heart control on every card, optimistic UI, guests are prompted to log in |
| Contact-unlock history | `GET /me/unlocks` | Audit-backed, shown in the buyer dashboard |

---

## 9. Implementation phases

Each phase ends with something demonstrable and independently verifiable.

| # | Phase | Deliverable | Done when |
| --- | --- | --- | --- |
| 0 | **Decisions** (3 days) | Workspace vs OAuth Drive, mandatory documents, Viewer accounts, listing rights | Client sign-off recorded in `00-requirements-analysis.md` |
| 1 | **Foundations** (1 wk) | Monorepo, TypeScript strict, Prisma + Postgres + Redis in docker-compose, CI (lint, typecheck, test), error model, logger, config validation | `pnpm dev` runs API + web; CI green |
| 2 | **Reference data** (1 wk) | LGD import for Gujarat; district / taluka / village tables; pincode lookup with cache; amenity and land-type reference | The cascade dropdown works end to end with real data |
| 3 | **Auth & roles** (1.5 wk) | Register / login / refresh / logout, JWT cookies, CSRF, four roles, guards, RBAC matrix tests, password change, forgot / reset, email verification | Every RBAC cell has a passing test |
| 4 | **Frontend shell** (1 wk) | Session provider, typed API client, route guards, the four dashboard shells in the LocateX design system, profile + avatar + password screens | A user of each role sees their dashboard |
| 5 | **Property domain** (1.5 wk) | Schema, status state machine, create / edit draft, listing search with filters and pagination, role-aware serializer including the price band | Guest sees a band, buyer sees the price — proven by tests |
| 6 | **Submit Property wizard** (2 wk) | Five steps, autosaved draft, validation shared with the API, map picker with geocoding and precision levels | A broker submits a complete listing on a phone |
| 7 | **Drive integration** (1.5 wk) | Shared Drive setup, `drive.file` service account, folder strategy, resumable upload sessions, confirm + metadata, archive / versioning, cleanup job | Documents land in the owner's Drive and download through the authorised proxy |
| 8 | **Approval workflow** (1 wk) | Admin queue, approve / reject with reason, published listings go public, audit events | Reject → broker edits → resubmit → approve, all emailed |
| 9 | **Email system** (1 wk) | BullMQ, provider adapter, 12 templates, `email_log`, admin view, contact form end to end | Every template renders and sends in staging |
| 10 | **Favourites & inquiries** (0.5 wk) | Server-side likes, inquiry endpoint, buyer dashboard lists | Likes survive logout and a device change |
| 11 | **Chat** (1.5 wk) | Conversations, messages, Socket.IO, read receipts, unread badges, the 24-hour digest job | Two browsers converse live; the digest fires in a time-shifted test |
| 12 | **Public pages** (1.5 wk) | Listing grid and map, property detail with map and documents, broker profiles, tools, news, contact | Home → search → detail → unlock → chat, as one journey |
| 13 | **Admin console** (1 wk) | KPIs, users, broker applications, contact inbox, news / ads scheduling | Admin runs a full day's work without a database client |
| 14 | **Hardening** (1 wk) | Security review, rate limits, load check on search and uploads, accessibility pass, error / empty / loading states everywhere | The checklist in `03-technical-spec.md` is signed off |
| 15 | **Launch** (0.5 wk) | Staging → production, domains and cookie config, backups, monitoring and alerts, v1 data migration | Production smoke tests pass |

Roughly **17–18 working weeks** for one full-stack developer; about **10–11** with a second
developer taking the frontend from Phase 4 onward. Phases 1–8 are the critical path; chat
(11) and the admin console (13) can move later without blocking launch.

### v1 data migration (Phase 15)

Users (roles remapped `user → buyer`, `agent → broker`), properties (Cloudinary URLs kept,
`0,0` coordinates flagged `location_precision = 'pincode'` and re-geocoded from the pincode)
and contact messages. v1's dropped documents cannot be recovered — brokers will be asked to
re-upload through the new Drive-backed flow.

---

## 10. Open decisions blocking Phase 0

1. Google **Workspace** account for the Shared Drive — yes or no?
2. Which property documents are **mandatory** before submission?
3. Are **Viewer** accounts real, or is Viewer simply a guest?
4. May **owners** post directly, or brokers only (v1 allowed anyone)?
5. Confirm the price-band rounding (₹1 lakh steps) so the exact price cannot be derived.
6. Email sending domain and provider — SPF/DKIM must be in place before Phase 9.
