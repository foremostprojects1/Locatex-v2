import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '@locatex/contracts';
import { AppError } from '../../shared/AppError.js';
import { requestIdOf } from './requestId.js';
import { logger } from '../../infrastructure/observability/logger.js';

const zodToDetails = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join('.') || undefined,
    code: issue.code.toUpperCase(),
    message: issue.message,
  }));

/** Nothing else in the codebase writes an error response. */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const appError =
    error instanceof AppError
      ? error
      : error instanceof ZodError
        ? AppError.validation(zodToDetails(error))
        : new AppError('INTERNAL', 'Something went wrong on our side.', { cause: error });

  if (appError.status >= 500) {
    logger.error(
      { err: error, requestId: requestIdOf(req), path: req.path },
      'unhandled error',
    );
  } else {
    logger.warn(
      { code: appError.code, requestId: requestIdOf(req), path: req.path },
      'request rejected',
    );
  }

  if (appError.retryAfterSeconds) {
    res.setHeader('Retry-After', String(appError.retryAfterSeconds));
  }

  const body: ApiErrorBody = {
    error: {
      code: appError.code,
      message: appError.message,
      requestId: requestIdOf(req),
      ...(appError.details ? { details: appError.details } : {}),
    },
  };

  res.status(appError.status).json(body);
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError('NOT_FOUND', `No route matches ${req.method} ${req.path}.`));
}
