import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import type { Express } from 'express';

/**
 * Single-deployment mode. A throwaway `dist` stands in for the real Vite build so the test
 * stays fast and does not depend on the web app having been built.
 */
describe('serving the web app from the API', () => {
  let distPath: string;
  let app: Express;
  let resetEnvForTests: () => void;

  beforeAll(async () => {
    distPath = fs.mkdtempSync(path.join(os.tmpdir(), 'locatex-web-'));
    fs.mkdirSync(path.join(distPath, 'assets'));
    fs.writeFileSync(path.join(distPath, 'index.html'), '<!doctype html><title>LocateX</title>');
    fs.writeFileSync(path.join(distPath, 'assets', 'main-abc123.js'), 'console.log(1)');
    fs.writeFileSync(path.join(distPath, 'robots.txt'), 'User-agent: *');

    process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017';
    process.env.JWT_SECRET ??= 'x'.repeat(32);
    process.env.SERVE_WEB = 'true';
    process.env.WEB_DIST_PATH = distPath;

    ({ resetEnvForTests } = await import('../../src/config/env.js'));
    resetEnvForTests();
    const { createApp } = await import('../../src/http/app.js');
    app = createApp();
  });

  afterAll(() => {
    delete process.env.SERVE_WEB;
    delete process.env.WEB_DIST_PATH;
    resetEnvForTests();
    fs.rmSync(distPath, { recursive: true, force: true });
  });

  it('serves the app shell at the root', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('LocateX');
    expect(response.headers['cache-control']).toContain('no-cache');
  });

  it('serves a deep client-side route with the same shell', async () => {
    const response = await request(app).get('/property/PROP-123/documents');
    expect(response.status).toBe(200);
    expect(response.text).toContain('LocateX');
  });

  it('caches fingerprinted assets hard', async () => {
    const response = await request(app).get('/assets/main-abc123.js');
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toContain('immutable');
  });

  it('serves static files that are not fingerprinted', async () => {
    const response = await request(app).get('/robots.txt');
    expect(response.status).toBe(200);
  });

  it('still answers unknown API paths with JSON, not the app shell', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.text).not.toContain('<!doctype html>');
  });

  it('keeps the health endpoint working', async () => {
    const response = await request(app).get('/healthz');
    expect(response.status).toBe(200);
  });
});

describe('CORS in single-deployment mode', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017';
    process.env.JWT_SECRET ??= 'x'.repeat(32);
    process.env.CORS_ORIGINS = 'https://www.locatex.in';
    const { resetEnvForTests } = await import('../../src/config/env.js');
    resetEnvForTests();
    const { createApp } = await import('../../src/http/app.js');
    app = createApp();
  });

  afterAll(async () => {
    delete process.env.CORS_ORIGINS;
    const { resetEnvForTests } = await import('../../src/config/env.js');
    resetEnvForTests();
  });

  it('allows a request whose Origin is the server itself', async () => {
    const response = await request(app).get('/healthz').set('Origin', 'http://127.0.0.1:8099').set('Host', '127.0.0.1:8099');
    expect(response.status).toBe(200);
  });

  it('allows a configured origin', async () => {
    const response = await request(app).get('/healthz').set('Origin', 'https://www.locatex.in');
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('https://www.locatex.in');
  });

  it('answers an unknown origin without CORS headers, and without a 500', async () => {
    const response = await request(app).get('/healthz').set('Origin', 'https://evil.example');
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
