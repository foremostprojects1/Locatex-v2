import { Router, type Router as ExpressRouter } from 'express';
import rateLimit from 'express-rate-limit';
import { receiveContactMessage } from '../../application/admin/contact.js';
import { liveNews } from '../../application/admin/news.js';
import { principalOf } from '../middleware/authenticate.js';
import { AppError } from '../../shared/AppError.js';
import { notifier } from '../../container.js';

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
