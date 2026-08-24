# LocateX v2 — Pre-deployment checklist

Everything that has to exist, be configured, or be run before the site can serve a real
visitor. Work top to bottom: section A can be done in any order, but B depends on A and C
depends on B.

Status of the code itself is in `06-task-board.md`. This file is only about the things that
live outside the repository.

---

## A. Accounts and services to create

| # | What | Why | Blocking? |
| --- | --- | --- | :-: |
| A1 | **MongoDB Atlas cluster** | The database. Must be a replica set — the submit and approve flows use transactions and a standalone MongoDB refuses them. Every Atlas tier is a replica set, so the free M0 is fine to start. | **Yes** |
| A2 | **Redis instance** | The job queue. Every email goes through it. Upstash, Redis Cloud's free tier, or the host's own add-on all work. | **Yes** |
| A3 | **Gmail account with 2-factor authentication** | Outgoing mail (decision D6). | **Yes** |
| A4 | **Gmail app password** | The sixteen-character credential the API authenticates with. The account's real password is never used. Create at <https://myaccount.google.com/apppasswords>. | **Yes** |
| A5 | **SMS provider account** | Phone OTP is **mandatory** at sign-up. Codes are generated, rate-limited and verified, but nothing sends them — so **without this, nobody can complete registration**. MSG91 and Fast2SMS are the usual Indian choices; Twilio works but costs more per message. | **Yes** |
| A6 | **Domain and DNS** | `locatex.in` or whichever, pointed at the host. | **Yes** |
| A7 | **Node host** | One process serves the API and the built site; the worker is a second process from the same checkout. Render, Railway, Fly or a plain VPS. Node 20.11 or newer. | **Yes** |
| A8 | **TLS certificate** | Session cookies are `Secure`; without HTTPS nobody stays signed in. Most hosts issue this automatically. | **Yes** |
| A9 | **Google account for Drive** | Document uploads (Phase 6). Not needed to launch without document upload, but Phase 6 cannot start until it exists. | For Phase 6 |
| A10 | **Google Maps API key + billing** | Only if you choose Google over OpenStreetMap for the map. The picker works today without one. | Optional |

### A5 deserves a second look

This is the one that quietly stops a launch. The sign-up flow requires **both** an email link
and a phone code, by your decision. Everything on the phone side is built and tested; the
`SmsSender` port simply has no implementation behind it. Until a provider is connected,
development logs the code to the console — which is fine on a laptop and useless in
production.

Two ways forward, and either is fine, but one has to be chosen:

1. **Connect a provider.** Roughly an hour of work once you have credentials.
2. **Make the phone optional at sign-up** and verify it later, when a buyer first contacts a
   broker. This is a decision change, not a code shortcut — say so if you want it.

---

## B. Environment variables

All of these go on the API process. The application **refuses to boot** if a required one is
missing or malformed, which is deliberate: a bad deploy should fail immediately rather than
at the first request that happens to need the setting.

### Required

| Variable | Example | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | |
| `PORT` | `8080` | Whatever the host expects. |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net` | From Atlas. |
| `MONGODB_DB_NAME` | `locatex` | |
| `REDIS_URL` | `rediss://…` | |
| `JWT_SECRET` | 32+ random characters | Generate with `openssl rand -base64 48`. **Changing it signs everyone out.** |
| `APP_BASE_URL` | `https://locatex.in` | Used to build the links inside emails. Wrong here means every confirmation link is broken. |
| `API_BASE_URL` | `https://locatex.in` | Same origin in single-deployment mode. |
| `CORS_ORIGINS` | `https://locatex.in` | Same-origin requests always pass; this is for anything else. |
| `SERVE_WEB` | `true` | Makes the API serve the built site. This is what makes it one deployment. |

### Mail

| Variable | Example | Notes |
| --- | --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` | **Leave empty and nothing is sent** — messages are logged instead. |
| `SMTP_PORT` | `587` | |
| `SMTP_SECURE` | `false` | `true` only for port 465. |
| `SMTP_USER` | `you@gmail.com` | |
| `SMTP_PASSWORD` | the app password | Not the account password. |
| `MAIL_FROM` | `info@locatex.in` | Must be a verified "Send mail as" alias or Gmail rewrites it — see C6. |
| `MAIL_FROM_NAME` | `LocateX` | |
| `MAIL_REPLY_TO` | `info@locatex.in` | |
| `EMAIL_DAILY_LIMIT` | `450` | Gmail locks a free account near 500/day. |
| `EMAIL_DAILY_WARN_AT` | `350` | |

### Optional

| Variable | When you need it |
| --- | --- |
| `COOKIE_DOMAIN` | Only if the app spans subdomains, e.g. `.locatex.in`. Leave unset for a single host. |
| `QUEUE_PREFIX` | If one Redis instance is shared between staging and production. Set a different value per environment or they will consume each other's jobs. |
| `LOG_LEVEL` | `info` in production. |
| `WEB_DIST_PATH` | Only if the built site is not where the API expects it. |
| `AUTH_RATE_LIMIT_MAX` | Raise if the site sits behind a shared NAT and real users hit the limit. |
| `VITE_GOOGLE_MAPS_API_KEY` | Build-time, on the **web** build. Only if you chose Google Maps. |

---

## C. The deploy itself

### C1. Install with development dependencies

```bash
pnpm install --frozen-lockfile
```

**Not `--prod`.** The migration runner (`migrate-mongo`), the TypeScript runner (`tsx`) and
therefore the seed and admin scripts are all development dependencies. A production-only
install leaves you unable to run steps C3 to C5. If your host insists on a lean runtime
image, run those three steps from a machine that has the full install and points at the same
database.

### C2. Build

```bash
pnpm build
```

Builds the contracts package, then the web app, then the API — in that order, because each
depends on the one before.

### C3. Create the collections and indexes

```bash
pnpm migrate:up
```

Creates the indexes ahead of time so the running application never builds one in the
foreground against a live collection. `pnpm migrate:status` shows what has run.

### C4. Seed Gujarat

```bash
pnpm seed:reference
```

**Do not skip this.** It loads 34 districts, 394 talukas, 8,917 villages, 1,026 pincodes and
the amenity vocabulary. Without it every address dropdown in the submit wizard is empty and
no listing can be created. It is idempotent, so running it again is safe and is how you pick
up a later correction to the data.

### C5. Create the first administrator

```bash
pnpm create:admin -- --email you@locatex.in --phone 9876543210 --name "Your Name"
```

It asks for a password twice and creates a fully verified, active administrator. Nothing
else in the system can do this — there is no endpoint that mints administrators, because an
endpoint that does is an endpoint someone eventually reaches. Every subsequent admin is
promoted from the dashboard by this one.

For an unattended provisioning script, set `ADMIN_PASSWORD` in the environment instead of
being prompted. Never pass a password as a command-line argument: arguments land in shell
history and in the process list.

### C6. Verify the "Send mail as" alias

If mail should come from `info@locatex.in` rather than the Gmail address, add it in Gmail
under **Settings → Accounts and Import → Send mail as**, and complete the verification email.
Gmail silently rewrites the `From` header to the Gmail account otherwise, and messages will
appear to come from a personal address.

### C7. Start both processes

```bash
pnpm start        # the API and the site — one process
pnpm worker:start # the queue consumer — a second process, same checkout
```

The site works without the worker, but **no email is ever delivered** — messages queue up
and stay queued. Whatever supervises the web process must supervise this one too.

---

## D. Verify before announcing

| # | Check | How |
| --- | --- | --- |
| D1 | The process is alive | `GET /healthz` returns 200 |
| D2 | The database is reachable | `GET /readyz` returns 200 |
| D3 | Reference data loaded | `GET /api/v1/reference/districts` returns 34 districts |
| D4 | The site is served | Open the domain; the home page renders with no console errors |
| D5 | The whole unit works | `pnpm verify:deployable` — 17 checks |
| D6 | Sign-up works end to end | Register a real account, confirm the email link, confirm the phone code, sign in |
| D7 | Mail actually leaves | The confirmation email arrives, and is not in spam |
| D8 | The admin dashboard opens | Sign in as the C5 account and open `/admin` |
| D9 | A listing can be posted | Post one as a broker, approve it as the admin, and view it signed out |

D6 and D9 are the ones that matter. Everything else can pass while the product is unusable.

---

## E. Operational setup

| # | What | Notes |
| --- | --- | --- |
| E1 | **Atlas backups** | Turn on continuous backups. The free tier has none — if the data matters, this alone justifies the paid tier. |
| E2 | **Uptime monitoring** | Point it at `/healthz`, not the home page: the home page is served from a cache and can succeed while the database is down. |
| E3 | **Log retention** | Logs are structured JSON with request ids. Phone numbers and email addresses are redacted at source, so they are safe to ship to a log service. |
| E4 | **Atlas network access** | Allow the host's IP addresses. Do not leave it open to `0.0.0.0/0`. |
| E5 | **Alert on the mail volume** | `/api/v1/admin/emails` reports the day's headroom. When it warns, arrange more capacity before Gmail locks the account. |
| E6 | **A staging environment** | Same variables, a different `QUEUE_PREFIX`, a different database. Worth it before the first real user, not after. |

---

## F. Known gaps to settle before launch

| # | Item | Decision needed from you |
| --- | --- | --- |
| F1 | **No SMS provider** | See A5. This blocks registration entirely. |
| F2 | **Google Maps or OpenStreetMap** | The picker works on OSM today with no key. Google needs a key, a billing account and a budget alert. |
| F3 | **Taluka-to-district table** | Assignments for districts created after the GeoNames snapshot were curated by hand and have not been checked by anyone who knows Gujarat. A wrong one puts listings in the wrong district. |
| F4 | **Document uploads (Phase 6)** | Blocked on a Google account. You can launch without it — brokers type the government record — but there is nowhere to upload a 7/12 extract until it is built. |
| F5 | **Nothing has run in a browser** | The React code is verified by its API contract, not by a browser — there is no headless browser in the build environment. Someone should click through sign-up, the wizard and the admin dashboard once. |
| F6 | **v1 data migration** | Phase 12. If existing listings and accounts must carry over, that is a separate piece of work with its own testing. |
