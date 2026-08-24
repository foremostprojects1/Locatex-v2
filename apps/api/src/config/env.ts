import { z } from 'zod';

/**
 * Every environment variable the API reads, validated once at startup. The process refuses
 * to boot on a missing or malformed value — a bad deploy fails immediately and loudly
 * rather than at the first request that happens to need the setting.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  APP_BASE_URL: z.string().url().default('http://localhost:5173'),
  API_BASE_URL: z.string().url().default('http://localhost:8080'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().default('locatex'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  /**
   * Namespace for every BullMQ key. Keeps environments that share one Redis instance —
   * and test runs that share a developer's local Redis — from consuming each other's jobs.
   */
  QUEUE_PREFIX: z.string().min(1).default('locatex'),

  /**
   * Single-deployment mode: the API also serves the built React app. Off in development
   * (Vite serves the app and proxies /api), on in production.
   */
  SERVE_WEB: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  WEB_DIST_PATH: z.string().optional(),

  /**
   * Credential-endpoint rate limits, per IP. Configurable because the right number depends
   * on whether the app sits behind a shared NAT, and because tests need them out of the way.
   */
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  AUTH_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  OTP_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  /**
   * Outgoing mail. Gmail with an app password (decision D6) — a Google account with
   * two-factor authentication issues a sixteen-character password for one application, so
   * the real account password is never in the environment and revoking it costs nothing.
   *
   * With no host configured the system logs what it would have sent instead of sending it,
   * which is how development and the test suite run.
   */
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  /** `true` for implicit TLS on 465; 587 upgrades with STARTTLS and wants this off. */
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  MAIL_FROM: z.string().email().optional(),
  MAIL_FROM_NAME: z.string().default('LocateX'),
  MAIL_REPLY_TO: z.string().email().optional(),

  /**
   * Gmail will not send more than about 500 messages a day from a free account, and it
   * enforces that by locking the account rather than by refusing one message. We stop
   * short of it ourselves and tell an administrator well before we get there.
   */
  EMAIL_DAILY_LIMIT: z.coerce.number().int().positive().default(450),
  EMAIL_DAILY_WARN_AT: z.coerce.number().int().positive().default(350),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  COOKIE_DOMAIN: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${detail}`);
  }
  return parsed.data;
}

export function env(): Env {
  cached ??= loadEnv();
  return cached;
}

/** Test helper: drop the memoised value so a different environment can be loaded. */
export function resetEnvForTests(): void {
  cached = undefined;
}
