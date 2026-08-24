import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from '../config/env.js';
import { logger } from '../infrastructure/observability/logger.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { referenceRouter } from './routes/reference.js';
import { propertyRouter } from './routes/properties.js';
import { propertyDraftRouter } from './routes/propertyDrafts.js';
import { adminRouter } from './routes/admin.js';
import { brokerRouter } from './routes/brokers.js';
import { brokerAreaRouter, meRouter } from './routes/buyer.js';
import { publicRouter } from './routes/public.js';
import { attachPrincipal } from './middleware/authenticate.js';
import { csrfProtection } from './middleware/csrf.js';
import { defaultWebDistPath, mountWebApp } from './serveWeb.js';

/** `new URL()` throws on a malformed value; config validation already guards these. */
const safeOrigin = (value: string): string => {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
};

/**
 * Builds the Express application. Kept separate from `server.ts` so integration tests can
 * mount it with supertest without opening a port.
 */
export function createApp(): Express {
  const app = express();
  const config = env();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => String((req as { id?: string | number }).id ?? 'unknown'),
      autoLogging: { ignore: (req) => req.url === '/healthz' || req.url === '/readyz' },
    }),
  );

  app.use(
    helmet({
      // When the API also serves the app, the CSP has to cover the page as well as the API.
      contentSecurityPolicy: config.SERVE_WEB
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              connectSrc: ["'self'", 'https://maps.googleapis.com'],
              frameSrc: ["'self'", 'https://www.youtube.com'],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              baseUri: ["'self'"],
            },
          }
        : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  // Same-origin requests must always pass — in single-deployment mode the app is served
  // from this very origin, so its own asset requests would otherwise be rejected. Unknown
  // origins get no CORS headers (the browser then blocks the response) rather than an
  // error, because a cross-origin probe is not a server fault and must not surface as 500.
  const configuredOrigins = new Set([
    ...config.CORS_ORIGINS,
    safeOrigin(config.APP_BASE_URL),
    safeOrigin(config.API_BASE_URL),
  ]);

  app.use(
    cors((req, callback) => {
      const origin = req.headers.origin;
      const sameOrigin = origin && origin === `${req.protocol}://${req.headers.host}`;
      const allowed = !origin || sameOrigin || configuredOrigins.has(origin);
      callback(null, { origin: allowed, credentials: true });
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.use(healthRouter);

  // Identify the caller, then verify that unsafe requests came from our own app.
  app.use(attachPrincipal);
  app.use('/api', csrfProtection);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/reference', referenceRouter);
  app.use('/api/v1/properties', propertyRouter);
  app.use('/api/v1/property-drafts', propertyDraftRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/brokers', brokerRouter);
  app.use('/api/v1/me', meRouter);
  app.use('/api/v1/broker', brokerAreaRouter);
  app.use('/api/v1', publicRouter);

  // The web app is mounted last: API routes always win, and an unknown /api/* path still
  // falls through to the JSON 404 below rather than being answered with index.html.
  if (config.SERVE_WEB) {
    mountWebApp(app, config.WEB_DIST_PATH ?? defaultWebDistPath());
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
