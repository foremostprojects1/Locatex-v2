# LocateX v2

Gujarat land marketplace. One repository, **one deployable unit**: the API process serves
both the JSON API and the built React app, so a release is a single container.

Design documents, decisions and the task board live in [`docs/`](docs).

## Getting started

```bash
pnpm install
cp apps/api/.env.example apps/api/.env      # fill in MONGODB_URI and JWT_SECRET
pnpm dev                                    # API :8080 and web :5173 together
```

**Services you need running.** MongoDB comes from **Atlas** — point `MONGODB_URI` at a
development cluster; Atlas is a replica set already, which the submit and approve flows
need for transactions. Redis is expected on `redis://127.0.0.1:6379` for the job queue
(`sudo apt install redis-server`, or set `REDIS_URL` to a hosted instance).

In development the two run separately — Vite serves the app on `:5173` and proxies `/api`
to the API on `:8080`, so the browser still sees a single origin and cookies stay
first-party, exactly as in production.

## Running it as one process

```bash
pnpm build     # contracts → web → api
pnpm start     # SERVE_WEB=true; the API serves the app on :8080
```

That is the whole deployment: one Node process, one port. On a Node host (Render, Railway,
a VPS under systemd or pm2) configure it as:

| Setting | Value |
| --- | --- |
| Build command | `pnpm install --frozen-lockfile --prod=false && pnpm build` — `--prod=false` because `NODE_ENV=production` otherwise skips the devDependencies the build needs |
| Start command | `pnpm start` |
| Node version | 22.20 (`.node-version`) — vite 8 needs `^20.19 \|\| >=22.12`, so 22.11 is too old |
| Health check | `GET /healthz` |

The background worker is a second process from the same checkout — `pnpm worker` — and is
only needed once email, chat digests and Drive uploads land in Phase 6 onward.

### How the single-process mode behaves

| Request | Served as |
| --- | --- |
| `/api/**` | JSON. An unknown path returns the standard JSON 404, never the app shell |
| `/healthz`, `/readyz` | Liveness / readiness JSON |
| `/assets/**` | Fingerprinted bundles, cached one year, `immutable` |
| `/images/**`, `/fonts/**`, … | Static files from the build, cached one hour |
| Anything else | `index.html` with `no-cache`, so client-side routes work on a hard refresh |

Set `SERVE_WEB=false` to run API-only (for example if the app is put on a CDN later);
nothing else changes.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | API and web together, in watch mode |
| `pnpm dev:api` / `pnpm dev:web` | One of them alone |
| `pnpm build` | Contracts, then web, then API |
| `pnpm start` | Serve the built app and API from one process |
| `pnpm worker` | Background jobs (email, chat digests, Drive retries) |
| `pnpm typecheck` | Type-check everything, tests included |
| `pnpm test` | Vitest across the workspace |
| `pnpm lint` / `pnpm format` | ESLint / Prettier |
| `pnpm verify:deployable` | Builds nothing, boots the built server and checks it really serves the app and the API |
| `pnpm migrate:up` / `migrate:down` | Mongo migrations |

## Layout

```
packages/contracts   zod schemas and business rules shared by API and web
                     (price band, roles, area units, location precision, error codes)
apps/api             Node 22 + Express 5 + Mongoose, layered:
                     http → application → domain → repositories → infrastructure
apps/web             React 19 + Vite — the branded LocateX site
docs/                architecture, decision log, task board
```

## Environment

Every variable is validated at startup with zod; the process refuses to boot on a missing
or malformed value rather than failing at the first request that needs it. See
`apps/api/.env.example` for the full list.
