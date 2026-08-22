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
  transport:
    env().NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});

export type Logger = typeof logger;
