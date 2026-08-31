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
import { EmailLogModel } from '../../infrastructure/db/models/EmailLog.js';
import { sentInLastDay } from '../../application/mail/mailer.js';
import { env } from '../../config/env.js';
import {
  listDistricts,
  listTalukas,
  listVillages,
  removeReference,
  upsertDistrict,
  upsertTaluka,
  upsertVillage,
} from '../../application/admin/reference.js';
import {
  disconnectDrive,
  driveConsentUrl,
  redirectUri,
} from '../../application/documents/connectDrive.js';
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

// ---------------------------------------------------------------------------
// Outgoing mail
// ---------------------------------------------------------------------------

/**
 * What the system has been sending, and how close that is to Gmail's ceiling.
 *
 * The headroom matters more than the list: a free Google account is locked, not throttled,
 * when it goes over roughly 500 messages a day, and the first warning Google gives is the
 * lock itself.
 */
adminRouter.get('/emails', async (req, res, next) => {
  try {
    const { status, template, limit } = z
      .object({
        status: z.enum(['queued', 'sent', 'failed', 'suppressed']).optional(),
        template: z.string().max(60).optional(),
        limit: z.coerce.number().int().positive().max(200).default(50),
      })
      .strict()
      .parse(req.query);

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (template) filter.template = template;

    const [rows, today] = await Promise.all([
      EmailLogModel.find(filter).sort({ _id: -1 }).limit(limit).lean(),
      sentInLastDay(),
    ]);

    const config = env();
    res.json({
      data: rows.map((row) => ({
        id: String(row._id),
        to: row.to,
        template: row.template,
        subject: row.subject,
        status: row.status,
        attempts: row.attempts,
        sentAt: row.sentAt ?? null,
        error: row.error ?? null,
        suppressedReason: row.suppressedReason ?? null,
        createdAt: row.createdAt,
      })),
      volume: {
        last24Hours: today,
        limit: config.EMAIL_DAILY_LIMIT,
        warnAt: config.EMAIL_DAILY_WARN_AT,
        remaining: Math.max(0, config.EMAIL_DAILY_LIMIT - today),
        /** True once an administrator should be arranging more headroom, not after. */
        shouldWarn: today >= config.EMAIL_DAILY_WARN_AT,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Connecting Google Drive
// ---------------------------------------------------------------------------

/** Step one: where to send the administrator to approve access. */
adminRouter.post('/storage/connect', async (req, res, next) => {
  try {
    const admin = userOf(req);
    res.json({ url: await driveConsentUrl(admin.id), redirectUri: redirectUri() });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/storage/disconnect', async (req, res, next) => {
  try {
    const admin = userOf(req);
    await disconnectDrive();

    await recordAudit({
      actorId: admin.id,
      actorRole: admin.role,
      action: 'storage.disconnect',
      subjectType: 'storage',
      subjectId: 'google_drive',
    });

    res.json({ connected: false });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Gujarat's own data — districts, talukas, villages
// ---------------------------------------------------------------------------

/**
 * Every list here is paged and searched on the server.
 *
 * There are nearly nine thousand villages. Sending them all and filtering in the browser
 * works with the seed data and stops working the first time a district's worth is added —
 * so the browser never holds more than one page.
 */
adminRouter.get('/reference/districts', async (req, res, next) => {
  try {
    res.json(await listDistricts(req.query));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/reference/talukas', async (req, res, next) => {
  try {
    res.json(await listTalukas(req.query));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/reference/villages', async (req, res, next) => {
  try {
    res.json(await listVillages(req.query));
  } catch (error) {
    next(error);
  }
});

/** Create or rename. The slug is the identity, so saving the same slug edits in place. */
for (const [kind, save] of [
  ['districts', upsertDistrict],
  ['talukas', upsertTaluka],
  ['villages', upsertVillage],
] as const) {
  adminRouter.put(`/reference/${kind}`, async (req, res, next) => {
    try {
      const admin = userOf(req);
      const result = await save(req.body);

      await recordAudit({
        actorId: admin.id,
        actorRole: admin.role,
        action: `reference.${kind}.save`,
        subjectType: 'reference',
        subjectId: String(Object.values(result)[0]),
        metadata: req.body as Record<string, unknown>,
      });

      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  });
}

/*
 * The id travels as a query parameter, not a path segment.
 *
 * A village id is `district/taluka/village/pincode` — it contains slashes, so as a path
 * segment it would need a wildcard route, and Express 5's router treats those differently
 * enough to be worth avoiding for something this small.
 */
adminRouter.delete('/reference/:kind', async (req, res, next) => {
  try {
    const admin = userOf(req);
    const kind = z.enum(['district', 'taluka', 'village']).parse(req.params.kind);
    const { id } = z.object({ id: z.string().min(1).max(120) }).parse(req.query);

    await removeReference(kind, id);
    await recordAudit({
      actorId: admin.id,
      actorRole: admin.role,
      action: `reference.${kind}.delete`,
      subjectType: 'reference',
      subjectId: id,
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
