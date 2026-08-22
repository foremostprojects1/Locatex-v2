import { describe, expect, it } from 'vitest';
import { AppError, statusForCode } from '../../src/shared/AppError.js';

describe('AppError', () => {
  it('maps codes to the documented status', () => {
    expect(statusForCode('VALIDATION_FAILED')).toBe(400);
    expect(statusForCode('UNAUTHENTICATED')).toBe(401);
    expect(statusForCode('NOT_OWNER')).toBe(403);
    expect(statusForCode('NOT_FOUND')).toBe(404);
    expect(statusForCode('INVALID_STATE_TRANSITION')).toBe(409);
    expect(statusForCode('FILE_TOO_LARGE')).toBe(413);
    expect(statusForCode('PROPERTY_NOT_SUBMITTABLE')).toBe(422);
    expect(statusForCode('RATE_LIMITED')).toBe(429);
    expect(statusForCode('STORAGE_QUOTA_EXCEEDED')).toBe(503);
    expect(statusForCode('INTERNAL')).toBe(500);
  });

  it('carries field level details for validation failures', () => {
    const error = AppError.validation([
      { field: 'khaataNumber', code: 'REQUIRED', message: 'Khaata number is required' },
    ]);
    expect(error.status).toBe(400);
    expect(error.details?.[0]?.field).toBe('khaataNumber');
  });
});
