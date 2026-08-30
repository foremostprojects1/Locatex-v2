import { Router, type Router as ExpressRouter } from 'express';
import rateLimit from 'express-rate-limit';
import { receiveContactMessage } from '../../application/admin/contact.js';
import { liveNews } from '../../application/admin/news.js';
import { z } from 'zod';
import { completeDriveConnection } from '../../application/documents/connectDrive.js';
import { principalOf } from '../middleware/authenticate.js';
import { AppError } from '../../shared/AppError.js';
import { notifier } from '../../container.js';
import { env } from '../../config/env.js';

/**
 * The two endpoints an unauthenticated visitor may write to or read from beyond listings:
 * the contact form, and whatever news is running today.
 */
export const publicRouter: ExpressRouter = Router();

/**
 * Tight, because a contact form is the classic unauthenticated write. Five an hour is more
 * than any real person needs and far less than a script wants.
 */
const contactLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(
      new AppError('RATE_LIMITED', 'You have sent us several messages already. We will reply to those first.', {
        retryAfterSeconds: 3600,
      }),
    ),
});

publicRouter.post('/contact', contactLimiter, async (req, res, next) => {
  try {
    const principal = principalOf(req);
    const result = await receiveContactMessage(
      req.body,
      {
        userId: principal.kind === 'user' ? principal.id : null,
        ip: req.ip ?? null,
        userAgent: req.get('user-agent') ?? null,
      },
      notifier(),
    );

    res.status(202).json({
      received: true,
      id: result.id,
      message: 'Thank you — we have your message and will reply by email.',
    });
  } catch (error) {
    next(error);
  }
});

publicRouter.get('/news', async (_req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({ data: await liveNews() });
  } catch (error) {
    next(error);
  }
});

/**
 * Where Google sends the administrator back to.
 *
 * Deliberately outside the admin router, and outside its URL prefix. This is a top-level
 * browser redirect issued by Google: it arrives as a plain GET with no CSRF header and no
 * way to add one. Being under `/api/v1/admin` was enough to fail on its own — that prefix
 * is guarded by a router mounted earlier, so the request was refused with a 401 before
 * this handler ran at all.
 *
 * What replaces those checks is the `state` parameter: a short-lived token this server
 * signed, naming the administrator who started the flow. Without it, anyone could hand a
 * signed-in administrator a crafted callback URL and attach their own Drive to the site.
 */
publicRouter.get('/storage/callback', async (req, res) => {
  try {
    const { code, state, error } = z
      .object({
        code: z.string().min(1).optional(),
        state: z.string().min(1).optional(),
        error: z.string().max(200).optional(),
      })
      .parse(req.query);

    // The administrator pressed "Cancel" on Google's screen.
    if (error || !code || !state) {
      res.redirect(`${env().APP_BASE_URL}/admin?storage=cancelled`);
      return;
    }

    const result = await completeDriveConnection(code, state);
    res.redirect(
      `${env().APP_BASE_URL}/admin?storage=connected&account=${encodeURIComponent(result.accountEmail ?? '')}`,
    );
  } catch (cause) {
    // A failure here lands in a browser, not in an API client, so it becomes a message on
    // the dashboard rather than a JSON body nobody would see.
    const message = cause instanceof Error ? cause.message : 'That did not work.';
    res.redirect(
      `${env().APP_BASE_URL}/admin?storage=failed&reason=${encodeURIComponent(message)}`,
    );
  }
});
