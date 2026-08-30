import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadDotenv } from 'dotenv';

/**
 * Reads `apps/api/.env` into the process, for local work only.
 *
 * **Imported for its side effect, and it must be the first import in an entry point.**
 * ES module imports are hoisted and evaluated before any statement in the importing file
 * runs, so calling a function further down would be too late: `logger.ts` reads
 * `env().LOG_LEVEL` while it is being evaluated, and by then the variables have to exist.
 *
 * `dotenv` was a dependency nothing imported, so `pnpm dev` and every script demanded the
 * variables be exported by hand and failed with "MONGODB_URI: Required" when they were
 * not — which reads like a bug in the application rather than a missing file.
 *
 * Deliberately does nothing in production. A deployed process takes its configuration from
 * the host's environment, and silently reading a stray `.env` left on the disk is how a
 * staging box ends up writing to the production database.
 */
export function loadEnvFile(): void {
  if (process.env.NODE_ENV === 'production') return;

  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps/api/.env'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      // `override: false` — a variable already exported on the command line wins, which is
      // what makes `MONGODB_URI=… pnpm dev` behave the way anyone would expect.
      loadDotenv({ path: candidate, override: false });
      return;
    }
  }
}

loadEnvFile();
