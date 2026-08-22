# Locatex v2 — Architecture (Deliverable A)

Companion documents: `00-requirements-analysis.md` (what was confirmed and what is open),
`02-ui-spec.md`, `03-technical-spec.md`, `04-implementation-plan.md`.

---

## 1. System architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│  Browser — React 19 + Vite (existing homelengo-react template)   │
│  session cookie only; no tokens, no Google credentials in JS     │
└───────────────┬──────────────────────────────────┬───────────────┘
                │ HTTPS, cookie auth               │ direct upload (resumable session URI)
                ▼                                  │
┌──────────────────────────────────────────┐       │
│  API — Node + TypeScript (layered)       │       │
│  routes → controllers → use cases →      │       │
│  domain → repositories → infrastructure  │       │
└───┬───────────┬────────────┬─────────────┘       │
    │           │            │                     │
    ▼           ▼            ▼                     ▼
┌────────┐ ┌─────────┐ ┌───────────┐      ┌────────────────┐
│Postgres│ │ Job     │ │ Mail      │      │ Google Drive   │
│(source │ │ queue   │ │ provider  │◄─────┤ (documents)    │
│of truth│ │(BullMQ) │ └───────────┘      └────────────────┘
└────────┘ └─────────┘
                │
                ▼
        ┌────────────────┐
        │ Image CDN      │  (images; see §6.2)
        └────────────────┘
```

**Principle:** Postgres is the system of record. Google Drive is a file store the
application writes to and records identifiers for. Drive folder structure is never queried
to answer an application question.

---

## 2. Component architecture (frontend)

The existing template already establishes the conventions to extend — layouts, a `Header`
with role-driven navigation, `PropertyCard`, `NiceSelect`, `RangeSliderWidget`, hooks for
carousels/animations, and a `services/` layer. v2 adds:

```text
src/
├── api/                      generated types + typed fetch client (cookie credentials)
│   ├── client.ts             fetch wrapper: credentials:'include', CSRF header, error mapping
│   └── properties.ts         one module per resource
├── auth/
│   ├── AuthProvider.tsx      session from GET /api/v1/auth/me, no token in JS
│   ├── useSession.ts
│   └── RequireRole.tsx       route guard; server still enforces
├── components/
│   ├── common/               existing + new primitives
│   ├── property/             PropertyCard, PropertyGrid, PriceDisplay, ContactLock
│   ├── forms/                Field, FileDropzone, StepNav, form primitives (RHF + zod)
│   ├── tools/                AreaConverter, EmiCalculator
│   └── feedback/             Skeleton, EmptyState, ErrorState, Toast
├── features/
│   ├── home/                 Home Page 1 sections
│   └── submit-property/      the wizard, one file per step
├── hooks/                    existing template hooks + useQuery wrappers
└── lib/                      area units, currency, price bucketing (shared with backend rules)
```

State: **TanStack Query** for all server state (caching, loading/error states, retries);
React state for UI only. No Redux — nothing in these flows justifies a global store. The
submit wizard keeps its draft server-side (see §5.3), so no cross-page client state either.

---

## 3. Backend architecture

### 3.1 Runtime and framework [Recommended]

**Node 22 + TypeScript (strict) + Express 5**, with the HTTP layer kept deliberately thin.

| Option | Why not chosen |
| --- | --- |
| **NestJS** | Best-in-class DI and structure, but heavy conventions and a steep on-ramp for a small team, and it invites coupling business logic to framework decorators. |
| **Fastify** | Faster and schema-first; a good alternative. Chosen against only because the team's existing code is Express and the performance difference is irrelevant at this scale. |
| **Express 5 + TS** *(chosen)* | Familiar to the team, minimal, and easy to keep framework-agnostic below the controller layer. Express 5 finally handles async errors natively. |

The framework choice is intentionally reversible: nothing below `controllers/` imports
Express types.

### 3.2 Layers

```text
routes/          HTTP verbs, paths, middleware wiring        (knows Express)
controllers/     parse → validate (zod) → call use case →    (knows Express)
                 map result to HTTP
application/     use cases: one class per business action    (framework-free)
domain/          entities, value objects, state machines,    (pure TypeScript)
                 invariants, policy/permission rules
repositories/    interfaces in domain, Prisma implementations in infrastructure
infrastructure/  Prisma, Drive adapter, mailer, queue, clock, id generator, logger
```

Rules enforced in review:

- `domain/` imports nothing from `node_modules` except types.
- Use cases depend on **interfaces** (`DocumentStorage`, `PropertyRepository`, `Mailer`,
  `Clock`), never on Prisma or `googleapis`.
- The composition root (`container.ts`) is the only place that constructs implementations.
  Manual constructor injection — no DI framework needed at this size, and it keeps tests
  trivial (pass a fake).

### 3.3 Why this shape

The single most valuable property here is that **Google Drive can be swapped for S3, or
Postgres for something else, without touching business rules** — which matters because the
Drive decision (§6) has unresolved constraints. The abstraction is one interface with five
methods, not a framework.

---

## 4. Data model

Postgres via Prisma. IDs are ULIDs generated by the application (sortable, no round-trip,
safe to expose). Every table has `created_at`, `updated_at`; user-facing records have
`deleted_at` for soft deletion.

### 4.1 Entities

**user**
`id, role(enum: buyer|broker|admin), full_name, email(unique, citext), phone(unique),
password_hash, email_verified_at, phone_verified_at, status(enum: active|inactive),
last_login_at, created_at, updated_at, deleted_at`

**buyer_profile** (1–1 with user where role = buyer)
`user_id, preferred_city, preferred_district, budget_min, budget_max`

**broker_profile** (1–1 with user where role = broker)
`user_id, agency_name, office_address, rera_number(nullable), bio, experience_years,
verification_status(enum: pending|verified|rejected), verified_at, verified_by,
rating_avg, rating_count`

**property**
`id, broker_id(→user), inserted_by(enum: owner|broker), title, description,
property_type(enum: land|plot|house|apartment|commercial|industrial),
listing_type(enum: sale|rent), price_amount(bigint, paise), price_unit(enum: total|per_vigha|per_acre|per_sqft),
status(enum: draft|pending|approved|rejected|sold|rented|withdrawn),
area_value, area_unit(enum: vigha|guntha|gaj|sqft|acre), area_sqm(generated, canonical),
gov_khaata_number, gov_survey_number, gov_area_text,
state, district, taluka, village, pincode,
latitude, longitude, boundary(jsonb, nullable),
amenities(text[]), disadvantages(text[]),
contact_name, contact_email, contact_phone, contact_whatsapp,
is_featured, published_at, views_count, created_at, updated_at, deleted_at`

*Note:* `area_sqm` is a generated canonical column so that search and sorting work across
mixed units — the Gujarat converter (DOCX §5) is a domain function, not just a UI widget.

**property_application** — the submission attempt, separate from the listing itself
`id, property_id, submitted_by, status(enum: draft|submitted|under_review|approved|rejected),
submitted_at, decided_at, decided_by, rejection_reason, drive_folder_id, version`

Keeping the application separate from the property lets a broker resubmit after rejection
without destroying the review history, and gives the Drive folder a stable owner record.

**property_document**
`id, property_id, application_id, category(enum: doc_712|doc_8a|utarotar|na_order|other),
storage_provider(enum: google_drive), drive_file_id, drive_folder_id,
file_name, mime_type, size_bytes, checksum_sha256, version, status(enum: pending|uploaded|failed|quarantined|deleted),
uploaded_by, uploaded_at, deleted_at`
Unique index on `(property_id, category, version)`; `checksum_sha256` deduplicates.

**property_image**
`id, property_id, storage_provider, external_id, url, width, height, is_primary, position, alt`

**favorite** `user_id, property_id, created_at` (PK on both) — server-side, replacing v1's localStorage.

**inquiry** `id, property_id, buyer_id, message, channel(enum: email|whatsapp|call),
status(enum: new|read|replied|closed), created_at` — the buyer→broker contact event, and
the record that proves the contact-unlock actually happened.

**contact_unlock** `id, user_id, property_id, unlocked_at` — audit of who saw which
broker's details; needed if the unlock ever becomes metered.

**news_item** `id, title, body, image_url, link_url, starts_at, ends_at, is_active,
created_by` — the admin's "timed news/advertisements".

**audit_event** `id, actor_id, actor_role, action, subject_type, subject_id,
metadata(jsonb), ip, user_agent, created_at` — append-only.

**upload_session** `id, application_id, category, drive_upload_uri, expires_at,
status(enum: open|completed|expired|aborted)` — supports resumable uploads and cleanup of
abandoned ones.

### 4.2 Property lifecycle

```text
draft ──submit──► pending ──approve──► approved ──mark sold──► sold
  ▲                  │                    │
  └──── edit ────────┘                    └──withdraw──► withdrawn
                     └──reject──► rejected ──edit+resubmit──► pending
```

Transitions live in `domain/property/PropertyStatus.ts` as an explicit table of allowed
moves plus the role permitted to make each one — never as scattered `if` statements.

### 4.3 Relationships

`user 1─n property` (as broker) · `property 1─n property_document` ·
`property 1─n property_image` · `property 1─1 property_application` (current) ·
`user n─n property` through `favorite` · `property 1─n inquiry`

---

## 5. Authentication and authorisation

### 5.1 Sessions [Recommended]

**httpOnly cookie sessions carrying a JWT**, replacing v1's `localStorage` Bearer tokens.

- `POST /api/v1/auth/login` sets two cookies:
  `lx_at` — access JWT, 15 min, `HttpOnly; Secure; SameSite=Lax; Path=/`
  `lx_rt` — refresh token (opaque, stored hashed in `refresh_token` table), 30 days,
  `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
- Refresh rotates and reuse-detects: a replayed refresh token revokes the whole family.
- `POST /api/v1/auth/logout` **actually revokes** the refresh family and clears cookies —
  fixing v1's no-op logout.
- CSRF: double-submit token. A non-httpOnly `lx_csrf` cookie is mirrored in an
  `X-CSRF-Token` header on every unsafe method; `SameSite` is the second line of defence.
- No token is ever readable from JavaScript, so XSS cannot exfiltrate a session.

**Trade-off:** cookies require the API and the site to share a registered domain (or
`SameSite=None; Secure` with a strict CORS allowlist). Plan for `api.locatex.in` +
`www.locatex.in`.

### 5.2 Permission matrix [Confirmed, from the DOCX]

| Capability | Viewer | Buyer | Broker | Admin |
| --- | :-: | :-: | :-: | :-: |
| Browse approved listings | ✓ | ✓ | ✓ | ✓ |
| See title, photos, city/state | ✓ | ✓ | ✓ | ✓ |
| See **price range** | ✓ | ✓ | ✓ | ✓ |
| See **exact price** | — | ✓ | ✓ | ✓ |
| See **broker phone/email** | — | ✓ | ✓ | ✓ |
| Save favourites | — | ✓ | ✓ | ✓ |
| Send inquiry | — | ✓ | — | ✓ |
| Create/edit own listing | — | — | ✓ | ✓ |
| Upload documents to own listing | — | — | ✓ | ✓ |
| Mark own listing sold/available | — | — | ✓ | ✓ |
| Approve/reject listings | — | — | — | ✓ |
| Activate/deactivate accounts | — | — | — | ✓ |
| Email brokers/users | — | — | — | ✓ |
| Post timed news/ads | — | — | — | ✓ |
| View KPI dashboard | — | — | own stats | ✓ |

Enforced in three places, all server-side: route guard (role), use-case policy (ownership),
and serializer (field-level redaction). The client mirrors this for UX only.

### 5.3 Field-level redaction

One `PropertyView` DTO per audience, produced by `domain/property/serialize.ts`:

- **public** — no contact fields at all, `priceRange` instead of `price`, coordinates
  rounded to ~1 km if maps are in scope.
- **authenticated** — exact price, full contact block, `isFavorite`.
- **owner/admin** — adds status, rejection reason, documents, audit trail.

The redaction happens before serialization, so a forgotten `select` cannot leak a phone
number.

---

## 6. Google Drive integration

### 6.1 Ownership model — the blocking decision

Service accounts have no usable Drive storage of their own. Two viable designs:

| | **A. Shared Drive + service account** *(recommended)* | **B. OAuth refresh token for an owner account** |
| --- | --- | --- |
| Requires | Google Workspace | Any Google account |
| Files owned by | The Shared Drive (the organisation) | One human's Drive |
| If the operator leaves | Nothing happens | Files and quota leave with them |
| Credential | Service-account key (rotatable) | Long-lived refresh token (fragile, revocable by the user) |
| Quota | Workspace pooled | That user's 15 GB unless paid |

**Recommendation: A.** If Workspace is not available, B is implementable behind the same
interface, and the switch is a configuration change plus a different `DriveClient`
construction — no business-logic impact.

### 6.2 What goes to Drive

**Documents only.** Property **images stay on a CDN** (Cloudinary is already integrated in
v1). Drive is a bad image host: no transformations, aggressive download quotas on shared
links, and slow first-byte. Mixing them also makes the public listing page depend on Drive
availability, which §11 of the brief explicitly wants to avoid.

### 6.3 Folder strategy

```text
Locatex Property Storage/            (Shared Drive root, id in env)
└── 2026/                            (year, keeps folder fan-out sane)
    └── PROP-01JB2X3Y4Z/             (property ULID, not the title)
        ├── application/             submitted form snapshot as JSON
        ├── documents/               7-12, 8A, Utarotar, NA order, other
        ├── images/                  only if a CDN is not used
        └── archive/                 superseded versions
```

Rules:

- Folder names are derived from **IDs**, never from user input — no title, no filename.
- Folder IDs are recorded in `property_application.drive_folder_id` when created; we never
  search Drive by name to find them.
- Every uploaded file is recorded in `property_document` with its `drive_file_id`,
  `mime_type`, `size_bytes`, `checksum_sha256`, `version`, and `category`.
- Superseding a document increments `version` and moves the previous file to `archive/`;
  nothing is hard-deleted for 90 days.
- Drive files are **never public**. Downloads are served through
  `GET /api/v1/properties/:id/documents/:documentId/content`, which authorises the request
  and streams (or issues a short-lived signed redirect). This keeps the audit trail honest.

### 6.4 Reliability rules

| Concern | Handling |
| --- | --- |
| Upload limits | 10 MB per image, 25 MB per document, 10 documents per property; enforced server-side before a session is issued |
| MIME validation | Extension **and** magic-byte sniff; allowlist `application/pdf`, `image/jpeg`, `image/png`, `image/webp` |
| Duplicates | `checksum_sha256` unique per property+category; re-uploading the same bytes returns the existing record |
| Failed uploads | `upload_session.status = expired`; a nightly job deletes orphaned Drive files with no `property_document` row |
| Partial submissions | Applications stay `draft`; documents attach to the draft and survive a browser crash |
| Retries | Idempotency key per upload confirmation; exponential backoff with jitter on 5xx/429 from Drive |
| Quotas | Per-user and per-app rate limits in front of Drive calls; queue absorbs bursts; 429 responses are retried, never surfaced as failures to the user |
| Auditability | Every create/replace/delete writes an `audit_event` with the Drive file ID |

---

## 7. OAuth and scopes

### 7.1 What exists today

**No Google OAuth exists in any part of the current product.** The only Google usage is the
**Maps JavaScript API with a plain API key** — in `Locatex-final-frontend/submit-property.html`
and `properties-details.html` (key `AIzaSy…3fOfM`, loaded with `libraries=places` but never
actually wired to an autocomplete), and in `homelengo-react/src/services/googleMaps.js`.

An API key is not OAuth and carries **no scopes**. So the scope list below is entirely new,
and we get to design it minimally from the start.

### 7.2 Proposed scopes [Recommended]

| Purpose | Scope | Why this and not more |
| --- | --- | --- |
| Backend → Drive (service account) | `https://www.googleapis.com/auth/drive.file` | Grants access **only to files the app itself creates**. Sufficient because the app creates every folder and file it touches and records the IDs. |
| — avoid — | `.../auth/drive` | Full read/write to the entire Drive. Never needed; would expose unrelated organisational files if the account is ever shared. |
| — avoid — | `.../auth/drive.readonly`, `.../auth/drive.metadata` | Broader read surface for no benefit. |
| Optional "Sign in with Google" | `openid`, `email`, `profile` | Identity only. Requests no Google data beyond the profile shown at consent. |
| Maps | *(none — API key)* | Restrict by HTTP referrer + enable only Maps JavaScript API; a second, IP-restricted key for any server-side Geocoding. |

**Consequence of `drive.file` to accept knowingly:** the app cannot list or recover files it
did not create. If the Drive folder is reorganised by a human, the app keeps working through
stored IDs but cannot rediscover moved files by name. That is the correct trade — it is
exactly why IDs, not filenames, are the primary key.

**Not used:** domain-wide delegation (no impersonation needed), and no Google scope is ever
requested from the end user for storage — Drive access belongs to the backend identity, not
to buyers or brokers.

### 7.3 Credential handling

Service-account JSON lives only in the backend's secret store (env var in the deploy
platform, or Secret Manager), is never committed, never bundled, never returned by an API,
and is rotated on a schedule. The React app receives **no Google credential of any kind**
except the referrer-restricted Maps key, which is public by design.

---

## 8. File-upload architecture

```text
1. POST /api/v1/properties/:id/documents/upload-session
   → server authorises, validates category/mime/size, creates the Drive resumable
     session, stores upload_session, returns { uploadUri, documentId, expiresAt }
2. Browser PUTs the bytes directly to uploadUri (Drive), with progress and resume
3. POST /api/v1/properties/:id/documents/:documentId/confirm  { checksum, size }
   → server verifies the file with Drive, writes property_document, audit event
```

**Why not stream through the API:** a 25 MB scan through Node consumes a request slot and
memory for the whole transfer, and gives the user no resumability on a flaky mobile
connection — which is the normal case for brokers uploading from the field.

**Why this is still safe:** the session URI is a short-lived capability URL scoped to one
file in one folder. No service-account credential reaches the browser. The server decides
*whether* a file may exist before the URI is issued, and the record only becomes real at
the confirm step.

**Fallback [kept in the design]:** `POST .../documents` with `multipart/form-data`, streamed
server-side. Used for small files, for clients that fail CORS preflight against Google, and
as the automatic retry path.

**Gate before committing to the direct path:** a one-day spike must confirm browser →
resumable-session-URI works cross-origin from our domains. If it does not, the fallback
becomes the default and the API surface does not change.

---

## 9. Security

| Area | Decision |
| --- | --- |
| Transport | HTTPS only, HSTS, secure cookies |
| Session | httpOnly + SameSite cookies, rotating refresh with reuse detection, real logout |
| CSRF | Double-submit token on all unsafe methods |
| CORS | Explicit origin allowlist, `credentials: true`, no wildcard |
| Headers | Helmet: CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame-ancestors none |
| Input | zod schema at every API boundary; unknown keys stripped, never passed to the ORM |
| Mass assignment | Use cases accept typed commands, not `req.body` spreads (v1's bug class) |
| Output | Role-aware serializers; contact/price redaction is a domain rule with tests |
| Files | Magic-byte + extension check, size caps, no execution, no public Drive links, downloads proxied and authorised |
| Rate limiting | Per-IP on auth and inquiry; per-user on uploads; per-app on Drive calls |
| Replay | Idempotency keys on submit and confirm endpoints |
| Secrets | Env/Secret Manager only; `.env.example` committed, `.env` never |
| Passwords | bcrypt (cost 12); reset tokens hashed with 10-minute expiry (v1 pattern kept) |
| Audit | Append-only `audit_event` for approvals, unlocks, document changes, account status changes |
| Least privilege | `drive.file` only; admin actions require the admin role server-side, never a client flag (v1's admin dashboard checked `localStorage`) |

---

## 10. Deployment considerations

- **Environments:** local (Atlas dev cluster + local Redis), staging, production.
  Separate Google projects and separate Drive roots per environment.
- **Hosting:** API as a container (Render/Fly/Cloud Run); frontend static on Vercel/CDN.
  Keep both under `*.locatex.in` so session cookies stay first-party.
- **Database:** managed Postgres with PITR. Prisma migrations run as a release step,
  expand-then-contract for breaking changes.
- **Workers:** the queue consumer runs as a second process from the same image.
- **Config:** entirely environment-driven; the app refuses to boot if a required variable is
  missing (fail fast, validated with zod at startup).
- **Observability:** structured JSON logs with a request id, error identifiers, uptime and
  latency checks on `/healthz` (liveness) and `/readyz` (DB + Drive reachable).
- **Backups:** Postgres PITR is the real backup; Drive holds files but is not a backup, so
  document metadata must be restorable independently.
