# Locatex v2 — Technical specification (Deliverable C)

---

## 1. Project structure

A pnpm workspace so the API contract types are shared rather than copy-pasted.

```text
locatex/
├── apps/
│   ├── web/                       React 19 + Vite (evolves from homelengo-react)
│   │   ├── src/{api,auth,components,features,hooks,lib,content,styles}
│   │   └── vite.config.ts
│   └── api/                       Node + TypeScript
│       ├── src/
│       │   ├── routes/            Express routers + middleware wiring
│       │   ├── controllers/       HTTP ↔ use case mapping
│       │   ├── application/       use cases (framework-free)
│       │   ├── domain/            entities, policies, state machines, pure rules
│       │   ├── repositories/      interfaces (domain) + Prisma impls (infra)
│       │   ├── infrastructure/
│       │   │   ├── drive/         DriveDocumentStorage + GoogleDriveClient
│       │   │   ├── db/            Prisma client, migrations
│       │   │   ├── mail/          mailer adapter
│       │   │   ├── queue/         BullMQ producers/consumers
│       │   │   └── observability/ logger, metrics, error ids
│       │   ├── config/            zod-validated env loader
│       │   └── container.ts       composition root — the only place that news up impls
│       ├── prisma/schema.prisma
│       └── test/{unit,integration,e2e}
├── packages/
│   ├── contracts/                 zod schemas + inferred types shared by web and api
│   └── domain-utils/              area conversion, EMI, price bucketing (shared rules)
└── docs/                          these documents
```

`packages/contracts` is what keeps frontend and backend contracts synchronised: one zod
schema per endpoint, imported by the API for validation and by the web app for typing and
form validation.

---

## 2. Environment variables

**API**

```bash
NODE_ENV=production
PORT=8080
APP_BASE_URL=https://www.locatex.in
API_BASE_URL=https://api.locatex.in
CORS_ORIGINS=https://www.locatex.in,https://locatex.in

DATABASE_URL=postgresql://…
REDIS_URL=redis://…

JWT_SECRET=…                       # access token signing
JWT_ACCESS_TTL=15m
REFRESH_TTL=30d
COOKIE_DOMAIN=.locatex.in

GOOGLE_SERVICE_ACCOUNT_JSON=…      # base64 of the key file; never committed
GOOGLE_DRIVE_ROOT_FOLDER_ID=…      # Shared Drive root for this environment
GOOGLE_DRIVE_MAX_DOC_MB=25

CLOUDINARY_URL=…                   # images (carried over from v1)

MAIL_PROVIDER=smtp|resend
MAIL_FROM="Locatex <no-reply@locatex.in>"
SMTP_URL=…

LOG_LEVEL=info
SENTRY_DSN=…                       # optional
```

**Web**

```bash
VITE_API_BASE_URL=https://api.locatex.in
VITE_GOOGLE_MAPS_API_KEY=…         # referrer-restricted, public by design
```

Startup validates every variable with zod and refuses to boot on a missing or malformed
value. `.env.example` is committed; `.env` never is.

---

## 3. API contracts

Base path `/api/v1`. JSON in, JSON out. Cookie auth, CSRF header on unsafe methods.

### 3.1 Conventions

- Collections return `{ data: T[], page: { cursor, limit, total } }`; cursor pagination on
  anything that can grow.
- Mutations that create resources accept an `Idempotency-Key` header.
- `PATCH` for partial updates; `PUT` is not used.
- Every response carries `X-Request-Id`, echoed in logs and error bodies.

### 3.2 Endpoints

**Auth**

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | role: buyer \| broker; role-specific profile payload |
| POST | `/auth/login` | public | sets `lx_at` + `lx_rt` + `lx_csrf`; rate-limited 5/min/IP |
| POST | `/auth/refresh` | cookie | rotates; reuse detection revokes the family |
| POST | `/auth/logout` | session | revokes refresh family, clears cookies |
| GET | `/auth/me` | session | current user + role + profile |
| POST | `/auth/forgot-password` · `/auth/reset-password` | public | hashed token, 10-min expiry |
| PATCH | `/auth/password` | session | requires current password |

**Properties**

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/properties` | public | filters: `district, taluka, village, propertyType, listingType, priceMin, priceMax, areaMin, areaMax, unit, sort, cursor`. Public projection (no contact, bucketed price) |
| GET | `/properties/:id` | public | projection by role; increments views once per session |
| POST | `/properties` | broker, admin | creates a **draft** + application + Drive folder |
| PATCH | `/properties/:id` | owner, admin | blocked once `approved` except for price/description/status |
| POST | `/properties/:id/submit` | owner | draft → pending; validates completeness; idempotent |
| POST | `/properties/:id/status` | owner (sold/available), admin (approve/reject) | body `{ action, reason? }`; validated against the state machine |
| DELETE | `/properties/:id` | owner, admin | soft delete |
| GET | `/properties/mine` | broker | own listings with status |
| POST/DELETE | `/properties/:id/favorite` | buyer | server-side favourites |
| GET | `/favorites` | buyer | |
| POST | `/properties/:id/inquiries` | buyer | records the inquiry, emails the broker |
| POST | `/properties/:id/contact-unlock` | buyer | returns contact details, writes the audit row |

**Documents**

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/properties/:id/documents/upload-session` | owner | validates category/mime/size, returns `{ documentId, uploadUri, expiresAt }` |
| POST | `/properties/:id/documents/:documentId/confirm` | owner | verifies with Drive, persists metadata; idempotent |
| POST | `/properties/:id/documents` | owner | fallback multipart upload |
| GET | `/properties/:id/documents` | owner, admin | metadata only |
| GET | `/properties/:id/documents/:documentId/content` | owner, admin | authorised stream/redirect |
| DELETE | `/properties/:id/documents/:documentId` | owner, admin | soft delete + archive move |

**Brokers, reference, content, admin**

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/brokers` · `/brokers/:id` | public | contact redacted for guests |
| POST | `/brokers/apply` | buyer | become-a-broker request |
| GET | `/reference/districts` · `/talukas` · `/property-types` · `/amenities` | public | cached, ETag'd |
| GET | `/stats/public` | public | homepage KPI counters |
| GET | `/news?active=true` | public | time-windowed items |
| GET | `/admin/properties?status=pending` | admin | review queue |
| GET | `/admin/stats` | admin | dashboard KPIs (active listings, pending approvals, total buyers, sold) |
| PATCH | `/admin/users/:id/status` | admin | activate/deactivate |
| POST | `/admin/messages` | admin | email brokers/users |
| POST/PATCH/DELETE | `/admin/news/:id?` | admin | timed news and ads |

### 3.3 Error model

One shape everywhere (RFC 9457 style):

```json
{
  "error": {
    "code": "PROPERTY_NOT_SUBMITTABLE",
    "message": "This property is missing required documents.",
    "requestId": "01JB2X3Y4Z…",
    "details": [{ "field": "doc712", "code": "REQUIRED", "message": "7/12 extract is required" }]
  }
}
```

| HTTP | When | Example codes |
| --- | --- | --- |
| 400 | Schema validation failed | `VALIDATION_FAILED` |
| 401 | No/expired session | `UNAUTHENTICATED`, `SESSION_EXPIRED` |
| 403 | Role or ownership denied | `FORBIDDEN`, `NOT_OWNER` |
| 404 | Missing or not visible | `NOT_FOUND` |
| 409 | State machine or duplicate | `INVALID_STATE_TRANSITION`, `DUPLICATE_DOCUMENT` |
| 413 | File too large | `FILE_TOO_LARGE` |
| 415 | Bad MIME | `UNSUPPORTED_MEDIA_TYPE` |
| 422 | Business rule failed | `PROPERTY_NOT_SUBMITTABLE` |
| 429 | Rate limited | `RATE_LIMITED` (with `Retry-After`) |
| 502/503 | Drive/mail unavailable | `STORAGE_UNAVAILABLE`, `RETRY_LATER` |

Codes are a closed enum in `packages/contracts`, so the frontend can switch on them and
tests can assert on them. Internal errors never leak stack traces or provider messages.

---

## 4. Google Drive resource strategy

Recorded in Postgres, never inferred from Drive:

| Application concept | Drive resource | Stored as |
| --- | --- | --- |
| Property | folder `PROP-{ulid}` | `property_application.drive_folder_id` |
| Document category | subfolder `documents/` | folder id cached per application |
| Uploaded file | file | `property_document.drive_file_id` |
| Superseded file | moved to `archive/` | previous row keeps its id, `version` increments |
| Application snapshot | `application/submission-v{n}.json` | file id on the application row |

Naming: `{category}-v{version}-{ulid}.{ext}` — collision-free, sortable, and meaningless to
guess. The original filename is preserved in metadata only.

Deletion: soft-delete the row, move the file to `archive/`, hard-delete after 90 days by a
scheduled job. Drive files are never trashed directly from a request handler.

---

## 5. Testing strategy

| Layer | Tool | What is covered | Gate |
| --- | --- | --- | --- |
| Domain unit | Vitest | Status transitions, permission policy, price bucketing, area conversion, document-requirement rules | 90% on `domain/` |
| Use case | Vitest + fakes | Submit flow, approval, unlock, upload confirm — with an in-memory `DocumentStorage` | every use case has a happy path + at least one failure |
| Repository | Vitest + Testcontainers Postgres | Prisma queries, constraints, soft delete | critical queries |
| API integration | Supertest + Testcontainers | Auth flows, RBAC (every matrix cell), validation errors, idempotency, pagination | all endpoints |
| Drive contract | Vitest, recorded fixtures + a nightly live smoke against a test Shared Drive | Resumable session, confirm, archive, quota/429 handling | adapter only |
| Frontend unit | Vitest + Testing Library | `PriceDisplay`, `ContactLock`, wizard step validation, converters | components with logic |
| E2E | Playwright | Guest browse → register → unlock contact; broker submit with documents → admin approve → public visibility | runs on PR |
| Accessibility | axe in Playwright | Home page and each wizard step | no serious violations |

The RBAC matrix in `01-architecture.md` §5.2 is encoded as a **table-driven integration
test** — one case per cell. That is the cheapest guarantee that the contact-hiding rule,
which is the product's commercial mechanic, cannot regress.

---

## 6. Logging, monitoring, error handling

- **Logging:** pino, JSON, one line per request with `requestId`, `userId`, `role`, route,
  status, duration. Domain events (`property.submitted`, `property.approved`,
  `document.uploaded`, `contact.unlocked`) logged at info with their subject id. PII
  (phone, email) redacted by a serializer allowlist.
- **Error identifiers:** every 5xx generates an id returned to the client and logged with
  the stack, so a user-reported "error 01JB2X…" is directly greppable.
- **Metrics:** request rate/latency/error ratio per route; queue depth and job failure rate;
  Drive call latency, 429 count, upload success ratio; business counters (submissions,
  approvals, unlocks).
- **Health:** `/healthz` liveness, `/readyz` checks Postgres and a cheap Drive `about.get`.
- **Alerts:** Drive error ratio > 5% for 5 min, queue depth growing for 15 min, auth failure
  spike, any unhandled rejection.
- **Async work** (BullMQ + Redis): send inquiry/admin emails, verify and post-process
  uploads, generate application snapshots, nightly cleanup of abandoned uploads, retry
  failed Drive operations with backoff. HTTP requests never block on Drive or SMTP.
