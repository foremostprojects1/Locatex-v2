import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017';
  process.env.JWT_SECRET = 'x'.repeat(32);
  process.env.NODE_ENV = 'test';
  const { createApp } = await import('../../src/http/app.js');
  app = createApp();
});

describe('health endpoints', () => {
  it('reports liveness without touching dependencies', async () => {
    const response = await request(app).get('/healthz');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('reports readiness as degraded while mongo is not connected', async () => {
    const response = await request(app).get('/readyz');
    expect(response.status).toBe(503);
    expect(response.body.checks.mongo).toBe(false);
  });

  it('returns the documented error shape for an unknown route', async () => {
    const response = await request(app).get('/api/v1/nope');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.requestId).toEqual(expect.any(String));
  });

  it('echoes a request id header', async () => {
    const response = await request(app).get('/healthz');
    expect(response.headers['x-request-id']).toBeTruthy();
  });
});
