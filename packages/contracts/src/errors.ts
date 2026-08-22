/**
 * The closed set of error codes the API may return. The frontend switches on these, so a
 * new code is an intentional contract change rather than a stray string.
 */
export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_OWNER',
  'NOT_FOUND',
  'CONFLICT',
  'INVALID_STATE_TRANSITION',
  'DUPLICATE_DOCUMENT',
  'FILE_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'PROPERTY_NOT_SUBMITTABLE',
  'STORAGE_UNAVAILABLE',
  'STORAGE_QUOTA_EXCEEDED',
  'EMAIL_NOT_VERIFIED',
  'PHONE_NOT_VERIFIED',
  'OTP_INVALID',
  'OTP_EXPIRED',
  'RATE_LIMITED',
  'RETRY_LATER',
  'INTERNAL',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
    details?: Array<{ field?: string; code: string; message: string }>;
  };
}
