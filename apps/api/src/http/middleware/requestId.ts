import type { NextFunction, Request, Response } from 'express';
import { ulid } from 'ulid';

/**
 * Every request carries an identifier, echoed in the response header, in the logs and in
 * any error body — so a user reporting "error 01JB2X…" is directly greppable.
 *
 * `req.id` is declared by pino-http as `string | number`; we always set a string, and
 * `requestIdOf` is the accessor the rest of the code uses.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  req.id = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : ulid();
  res.setHeader('X-Request-Id', String(req.id));
  next();
}

export const requestIdOf = (req: Request): string => String(req.id ?? 'unknown');
