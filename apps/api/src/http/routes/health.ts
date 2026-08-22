import { Router } from 'express';
import { isMongoHealthy } from '../../infrastructure/db/mongo.js';

export const healthRouter: Router = Router();

/** Liveness: the process is up. Never touches a dependency. */
healthRouter.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});

/** Readiness: the process can actually serve traffic. */
healthRouter.get('/readyz', (_req, res) => {
  const checks = { mongo: isMongoHealthy() };
  const ready = Object.values(checks).every(Boolean);
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'degraded', checks });
});
