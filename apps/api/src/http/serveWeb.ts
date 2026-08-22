import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { logger } from '../infrastructure/observability/logger.js';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Default location of the built web app relative to the compiled API:
 *   apps/api/dist/http/  →  ../../../web/dist
 * Kept as a default so a normal `pnpm build && pnpm start` works with no configuration.
 */
export const defaultWebDistPath = (): string =>
  path.resolve(here, '../../../web/dist');

/**
 * Serves the built React app from the API process, so the whole product ships as one
 * deployable unit.
 *
 * Two rules make this safe rather than merely convenient:
 *
 *  - It is mounted *after* every API route, so nothing under /api can be shadowed by a
 *    file on disk, and an unknown /api path still returns the JSON 404 the contract promises.
 *  - `index.html` is never cached while the hashed asset files are cached hard. Vite fingerprints
 *    everything in /assets, so a stale index.html is the only way a browser can end up
 *    loading assets that no longer exist.
 */
export function mountWebApp(app: Express, distPath: string): boolean {
  const indexFile = path.join(distPath, 'index.html');

  if (!fs.existsSync(indexFile)) {
    logger.warn(
      { distPath },
      'SERVE_WEB is on but no built web app was found — run `pnpm --filter @locatex/web build`',
    );
    return false;
  }

  // Fingerprinted assets: safe to cache for a year.
  app.use(
    '/assets',
    express.static(path.join(distPath, 'assets'), {
      immutable: true,
      maxAge: '1y',
      fallthrough: true,
    }),
  );

  // Everything else that exists on disk (images, fonts, favicon, robots.txt).
  app.use(
    express.static(distPath, {
      index: false,
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
      },
    }),
  );

  // SPA fallback: any remaining GET that is not an API call renders the app shell.
  app.get(/^\/(?!api\/).*/, (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    if (req.accepts('html') === false) return next();
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(indexFile);
  });

  logger.info({ distPath }, 'serving the web app from the API');
  return true;
}
