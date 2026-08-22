import type { ErrorCode } from '@locatex/contracts';

export interface ErrorDetail {
  field?: string;
  code: string;
  message: string;
}

/**
 * The only error type the HTTP layer knows how to translate. Use cases and the domain throw
 * these; anything else that escapes becomes a 500 with a generated identifier, so internals
 * are never leaked to a client.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: ErrorDetail[];
  readonly retryAfterSeconds?: number;

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      status?: number;
      details?: ErrorDetail[];
      retryAfterSeconds?: number;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = options.status ?? statusForCode(code);
    this.details = options.details;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }

  static validation(details: ErrorDetail[], message = 'The submitted data is not valid.') {
    return new AppError('VALIDATION_FAILED', message, { details });
  }

  static notFound(what = 'Resource') {
    return new AppError('NOT_FOUND', `${what} was not found.`);
  }

  static forbidden(message = 'You do not have access to this.') {
    return new AppError('FORBIDDEN', message);
  }

  static unauthenticated(message = 'Please sign in to continue.') {
    return new AppError('UNAUTHENTICATED', message);
  }
}

/** Default HTTP status per error code — overridable per throw site. */
export function statusForCode(code: ErrorCode): number {
  switch (code) {
    case 'VALIDATION_FAILED':
      return 400;
    case 'UNAUTHENTICATED':
    case 'SESSION_EXPIRED':
      return 401;
    case 'FORBIDDEN':
    case 'NOT_OWNER':
    case 'EMAIL_NOT_VERIFIED':
    case 'PHONE_NOT_VERIFIED':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'CONFLICT':
    case 'INVALID_STATE_TRANSITION':
    case 'DUPLICATE_DOCUMENT':
      return 409;
    case 'FILE_TOO_LARGE':
      return 413;
    case 'UNSUPPORTED_MEDIA_TYPE':
      return 415;
    case 'PROPERTY_NOT_SUBMITTABLE':
    case 'OTP_INVALID':
    case 'OTP_EXPIRED':
      return 422;
    case 'RATE_LIMITED':
      return 429;
    case 'STORAGE_UNAVAILABLE':
    case 'STORAGE_QUOTA_EXCEEDED':
    case 'RETRY_LATER':
      return 503;
    case 'INTERNAL':
    default:
      return 500;
  }
}
