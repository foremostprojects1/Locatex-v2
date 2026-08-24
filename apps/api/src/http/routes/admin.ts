import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import {
  PROPERTY_STATUSES,
  contactStatusSchema,
  userStatusSchema,
} from '@locatex/contracts';
import { searchProperties } from '../../application/property/searchProperties.js';
import { adminStats } from '../../application/admin/stats.js';
import { listUsers, setUserStatus } from '../../application/admin/users.js';
import { setContactStatus } from '../../application/admin/contact.js';
import { allNews, createNewsItem, deleteNewsItem, updateNewsItem } from '../../application/admin/news.js';
import { ContactMessageModel } from '../../infrastructure/db/models/ContactMessage.js';
import { serializeProperty } from '../../domain/property/serialize.js';
import { recordAudit } from '../../infrastructure/db/models/AuditEvent.js';
import { requireRole, userOf } from '../middleware/authenticate.js';

/**
 * The administrator's dashboard.
 *
 * Everything here is guarded once, at the router, and every state change is audited — an
 * admin action that cannot be reconstructed later is the one that will need reconstructing.
 */
export const adminRouter: ExpressRouter = Router();

adminRouter.use(requireRole('admin'));

adminRouter.get('/stats', async (_req, res, next) => {
  try {
    res.json({ data: await adminStats() });
  } catch (error) {
    next(error);
  }
});

/** The review queue. Defaults to what is waiting, which is what the page is for. */
adminRouter.get('/properties', async (req, res, next) => {
  try {
    const { status, ...query } = req.query;
    const wanted = z
      .enum(PROPERTY_STATUSES)
      .optional()
      .parse(status as string | undefined);

    const page = await searchProperties(query, {
      statuses: wanted ? [wanted] : ['pending'],
    });

    res.json({
      data: page.items.map((item) => serializeProperty(item, 'owner')),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/users', async (req, res, next) => {
  try {
    res.json(await listUsers(req.query));
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/users/:id/status', async (req, res, next) => {
  try {
    const admin = userOf(req);
    const { status } = z.object({ status: userStatusSchema }).strict().parse(req.body);

    await setUserStatus(admin.id, String(req.params.id), status);
    await recordAudit({
      actorId: admin.id,
      actorRole: admin.role,
      action: status === 'suspended' ? 'user.suspend' : 'user.activate',
      subjectType: 'user',
      subjectId: String(req.params.id),
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    res.json({ status });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Contact inbox
// ---------------------------------------------------------------------------

adminRouter.get('/contact-messages', async (req, res, next) => {
  try {
    const { status, limit } = z
      .object({
        status: contactStatusSchema.optional(),
        limit: z.coerce.number().int().positive().max(100).default(50),
      })
      .strict()
      .parse(req.query);

    const messages = await ContactMessageModel.find(status ? { status } : {})
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    res.json({
      data: messages.map((message) => ({
        id: String(message._id),
        name: message.name,
        email: message.email,
        phone: message.phone,
        subject: message.subject,
        message: message.message,
        propertyId: message.propertyId,
        status: message.status,
        adminNote: message.adminNote,
        createdAt: message.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/contact-messages/:id', async (req, res, next) => {
  try {
    const admin = userOf(req);
    const { status, note } = z
      .object({ status: contactStatusSchema, note: z.string().trim().max(2000).optional() })
      .strict()
      .parse(req.body);

    await setContactStatus(String(req.params.id), admin.id, status, note);
    res.json({ status });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// News and advertisements
// ---------------------------------------------------------------------------

adminRouter.get('/news', async (_req, res, next) => {
  try {
    res.json({ data: await allNews() });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/news', async (req, res, next) => {
  try {
    const admin = userOf(req);
    const item = await createNewsItem(admin.id, req.body);

    await recordAudit({
      actorId: admin.id,
      actorRole: admin.role,
      action: 'news.create',
      subjectType: 'news',
      subjectId: item.id,
    });

    res.status(201).json({ data: { id: item.id, title: item.title } });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/news/:id', async (req, res, next) => {
  try {
    const admin = userOf(req);
    const item = await updateNewsItem(admin.id, String(req.params.id), req.body);
    res.json({ data: { id: item.id, title: item.title } });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/news/:id', async (req, res, next) => {
  try {
    const admin = userOf(req);
    await deleteNewsItem(String(req.params.id));

    await recordAudit({
      actorId: admin.id,
      actorRole: admin.role,
      action: 'news.delete',
      subjectType: 'news',
      subjectId: String(req.params.id),
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
