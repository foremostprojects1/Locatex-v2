/**
 * Proves the repository still produces one runnable unit.
 *
 *   pnpm verify:deployable
 *
 * Builds nothing — run `pnpm build` first — but boots the built server exactly as a host
 * would, then checks that the same process serves the app shell, the hashed assets, a deep
 * client-side route and the JSON API, with the cache headers that keep a browser from
 * stranding itself on stale bundles.
 *
 * "It compiles" and "it boots and serves" are different claims, and only the second one is
 * what a deployment needs.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const API_ROOT = path.resolve(import.meta.dirname, '..');
const REPO_ROOT = path.resolve(API_ROOT, '../..');
const PORT = Number(process.env.VERIFY_PORT ?? 8123);
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
const failures: string[] = [];

function check(description: string, ok: boolean, detail = ''): void {
  if (ok) {
    passed += 1;
    console.warn(`  [32m✓[0m ${description}`);
  } else {
    failures.push(description);
    console.warn(`  [31m✗[0m ${description}${detail ? ` — ${detail}` : ''}`);
  }
}

async function statusOf(pathname: string): Promise<number> {
  const response = await fetch(`${BASE}${pathname}`, { redirect: 'manual' });
  return response.status;
}

async function postStatus(pathname: string): Promise<number> {
  const response = await fetch(`${BASE}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
    redirect: 'manual',
  });
  return response.status;
}

async function waitForBoot(server: ChildProcess): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`server exited with code ${server.exitCode}`);
    try {
      const response = await fetch(`${BASE}/healthz`);
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('server did not become healthy within 20s');
}

async function main(): Promise<void> {
  for (const artefact of ['apps/api/dist/server.js', 'apps/web/dist/index.html']) {
    if (!existsSync(path.join(REPO_ROOT, artefact))) {
      console.error(`missing ${artefact} — run \`pnpm build\` first`);
      process.exit(1);
    }
  }
  check('build produced both the API and the web bundle', true);

  // A throwaway database, so the check works on a laptop with no Atlas credentials.
  const mongo =
    process.env.MONGODB_URI ?? undefined;
  const replSet = mongo ? undefined : await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = mongo ?? replSet!.getUri();

  const server = spawn('node', ['apps/api/dist/server.js'], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      MONGODB_URI: mongoUri,
      MONGODB_DB_NAME: 'locatex-verify',
      JWT_SECRET: 'verification-secret-that-is-long-enough',
      SERVE_WEB: 'true',
      PORT: String(PORT),
      NODE_ENV: 'production',
      LOG_LEVEL: 'error',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const serverLog: string[] = [];
  server.stdout?.on('data', (chunk) => serverLog.push(String(chunk)));
  server.stderr?.on('data', (chunk) => serverLog.push(String(chunk)));

  try {
    await waitForBoot(server);
    check('the built server boots and reports healthy', true);

    check('app shell is served at /', (await statusOf('/')) === 200);
    check('a deep client-side route falls back to the shell', (await statusOf('/faq')) === 200);
    // The two routes our emails link to. A 404 here means every confirmation and reset
    // link we have ever sent is broken, which is not something to discover from a user.
    check('the email confirmation route is served', (await statusOf('/verify-email?token=x')) === 200);
    check('the password reset route is served', (await statusOf('/reset-password?token=x')) === 200);
    check('the browse page is served', (await statusOf('/properties')) === 200);
    check('chat is closed to strangers', (await statusOf('/api/v1/chat/threads')) === 401);
    // A strict search schema means a stray query parameter is a 400, not an ignored value —
    // so the browse page's own `view` parameter must never reach the API.
    check(
      'a search with filters answers',
      (await statusOf('/api/v1/properties?district=morbi&sort=price-asc&limit=2')) === 200,
    );
    check(
      'a static file from the build is served',
      (await statusOf('/images/locatex/brand/logo-dark.png')) === 200,
    );
    check('the reference API answers', (await statusOf('/api/v1/reference/districts')) === 200);
    check('the listings API answers', (await statusOf('/api/v1/properties')) === 200);
    check('the news endpoint answers', (await statusOf('/api/v1/news')) === 200);
    check('the admin dashboard is closed to strangers', (await statusOf('/api/v1/admin/stats')) === 401);
    check(
      'posting a listing without a session is refused',
      (await statusOf('/api/v1/properties')) === 200 && (await postStatus('/api/v1/properties')) === 401,
    );
    check('readiness reports the database', (await statusOf('/readyz')) === 200);

    const unknownApi = await fetch(`${BASE}/api/v1/nope`);
    const unknownBody = (await unknownApi.json()) as { error?: { code?: string } };
    check(
      'an unknown API path stays JSON instead of returning the app shell',
      unknownApi.status === 404 && unknownBody.error?.code === 'NOT_FOUND',
    );

    const shell = await fetch(`${BASE}/`);
    const html = await shell.text();
    check(
      'index.html is not cached, so clients never strand on old bundles',
      (shell.headers.get('cache-control') ?? '').includes('no-cache'),
      shell.headers.get('cache-control') ?? 'no header',
    );

    const asset = /\/assets\/index-[^"]+\.js/.exec(html)?.[0];
    if (asset) {
      const assetResponse = await fetch(`${BASE}${asset}`);
      check('the hashed bundle referenced by the shell is served', assetResponse.status === 200);
      check(
        'hashed assets are cached immutably',
        (assetResponse.headers.get('cache-control') ?? '').includes('immutable'),
        assetResponse.headers.get('cache-control') ?? 'no header',
      );
    } else {
      check('index.html references a hashed bundle', false);
    }
  } catch (error) {
    check('the built server boots and serves', false, String(error));
    console.warn(serverLog.join('').slice(-1500));
  } finally {
    server.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (server.exitCode === null) server.kill('SIGKILL');
    await replSet?.stop();
  }

  console.warn('');
  if (failures.length > 0) {
    console.warn(`deployable check FAILED — ${passed} passed, ${failures.length} failed`);
    process.exit(1);
  }
  console.warn(`deployable check passed — ${passed} checks`);
  process.exit(0);
}

await main();
