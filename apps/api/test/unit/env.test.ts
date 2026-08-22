import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

const base = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017',
  JWT_SECRET: 'a'.repeat(32),
};

describe('environment configuration', () => {
  it('applies defaults for optional settings', () => {
    const env = loadEnv(base as NodeJS.ProcessEnv);
    expect(env.PORT).toBe(8080);
    expect(env.NODE_ENV).toBe('development');
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5173']);
  });

  it('splits a comma separated origin list', () => {
    const env = loadEnv({
      ...base,
      CORS_ORIGINS: 'https://www.locatex.in, https://locatex.in',
    } as NodeJS.ProcessEnv);
    expect(env.CORS_ORIGINS).toEqual(['https://www.locatex.in', 'https://locatex.in']);
  });

  it('refuses to start without a database uri', () => {
    expect(() => loadEnv({ JWT_SECRET: 'a'.repeat(32) } as NodeJS.ProcessEnv)).toThrow(
      /MONGODB_URI/,
    );
  });

  it('refuses a weak jwt secret', () => {
    expect(() => loadEnv({ ...base, JWT_SECRET: 'short' } as NodeJS.ProcessEnv)).toThrow(
      /at least 32 characters/,
    );
  });
});
