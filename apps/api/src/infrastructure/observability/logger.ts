import { createRequire } from 'node:module';
import { pino } from 'pino';
import { env } from '../../config/env.js';

/**
 * Structured JSON logs. Personal data is redacted by an allow-list rather than by
 * remembering to leave it out at each call site — phone numbers and emails belong to
 * brokers and buyers, and must not sit in log storage.
 */
export const logger = pino({
  level: env().LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.refreshToken',
      '*.phone',
      '*.email',
      '*.contactPhone',
      '*.contactEmail',
    ],
    censor: '[redacted]',
  },
  /**
   * Human-readable logs in development, JSON everywhere else.
   *
   * `pino-pretty` is a development dependency, so a production install that omits dev
   * dependencies has nothing to load. Resolving it here rather than naming it as a string
   * means a missing module leaves plain JSON logs instead of refusing to start — a
   * formatter is not worth a boot failure.
   */
  transport: prettyTransport(),
});

export type Logger = typeof logger;

function prettyTransport(): { target: string; options: Record<string, unknown> } | undefined {
  if (env().NODE_ENV !== 'development') return undefined;
  try {
    // `require.resolve` is not defined in an ES module; this is the supported way to ask
    // "is this package installed?" without importing it.
    createRequire(import.meta.url).resolve('pino-pretty');
    return { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } };
  } catch {
    return undefined;
  }
}
