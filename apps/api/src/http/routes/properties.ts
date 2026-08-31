import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { PROPERTY_STATUSES, statusChangeSchema, type PropertyStatus } from '@locatex/contracts';
import { PropertyModel } from '../../infrastructure/db/models/Property.js';
import { createProperty, updateProperty } from '../../application/property/writeProperty.js';
import { changeStatus } from '../../application/property/changeStatus.js';
import { searchProperties } from '../../application/property/searchProperties.js';
import {
  actionsFor,
  audienceFor,
  serializeProperty,
} from '../../domain/property/serialize.js';
import { recordAudit } from '../../infrastructure/db/models/AuditEvent.js';
import { principalOf, requireRole, requireUser, userOf } from '../middleware/authenticate.js';
import { AppError } from '../../shared/AppError.js';
import { notifier } from '../../container.js';
import { recordContactUnlock, sendEnquiry } from '../../application/buyer/enquiries.js';

/**
 * Listings over HTTP.
 *
 * Every response goes through `serializeProperty`, which builds the body for the caller's
 * audience rather than stripping fields from the document — so a guest cannot be shown a
 * price or a phone number by forgetting a `select`.
 */
export const propertyRouter: ExpressRouter = Router();

/** Public search. Guests and buyers hit the same query; only the projection differs. */
propertyRouter.get('/', async (req, res, next) => {
  try {
    const principal = principalOf(req);
    const page = await searchProperties(req.query);

    res.json({
      data: page.items.map((item) =>
        serializeProperty(item, audienceFor(principal, item)),
      ),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * How many live listings there are, by district and by land type.
 *
 * The home page used to print invented numbers beside each district — "186 listings" under
 * Morbi when there were none at all. A number a visitor can disprove by clicking is worse
 * than no number, so these are counted, and a district with nothing in it says so.
 *
 * One aggregation rather than a query per district: there are 34 of them.
 */
propertyRouter.get('/counts', async (_req, res, next) => {
  try {
    const [byDistrict, byType] = await Promise.all([
      PropertyModel.aggregate<{ _id: string; count: number }>([
        { $match: { status: 'approved', deletedAt: null } },
        { $group: { _id: '$location.district', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      PropertyModel.aggregate<{ _id: string; count: number }>([
        { $match: { status: 'approved', deletedAt: null } },
        { $group: { _id: '$propertyType', count: { $sum: 1 } } },
      ]),
    ]);

    const total = byType.reduce((sum, row) => sum + row.count, 0);

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({
      total,
      districts: Object.fromEntries(byDistrict.map((row) => [row._id, row.count])),
      propertyTypes: Object.fromEntries(byType.map((row) => [row._id, row.count])),
    });
  } catch (error) {
    next(error);
  }
});

/** A broker's own listings, in every status including drafts. */
propertyRouter.get('/mine', requireRole('broker', 'admin'), async (req, res, next) => {
  try {
    const user = userOf(req);
    // `status` is not part of the public search contract, so it is read and removed here
    // rather than widening a schema that guests also post to.
    const { status: requested, ...query } = req.query;
    const status = z.enum(PROPERTY_STATUSES).optional().parse(requested as string | undefined);

    const page = await searchProperties(query, {
      brokerId: user.id,
      statuses: status ? [status] : PROPERTY_STATUSES,
    });

    res.json({
      data: page.items.map((item) => ({
        ...serializeProperty(item, 'owner'),
        actions: actionsFor(item, principalOf(req)),
      })),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  } catch (error) {
    next(error);
  }
});

propertyRouter.post('/', requireRole('broker', 'admin'), async (req, res, next) => {
  try {
    const user = userOf(req);
    const property = await createProperty(user.id, req.body);

    await recordAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'property.create',
      subjectType: 'property',
      subjectId: property.id,
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    res.status(201).json({
      data: serializeProperty(property, 'owner'),
      actions: actionsFor(property, principalOf(req)),
    });
  } catch (error) {
    next(error);
  }
});

propertyRouter.get('/:id', async (req, res, next) => {
  try {
    const principal = principalOf(req);
    const property = await PropertyModel.findOne({ _id: req.params.id, deletedAt: null }).lean();
    if (!property) throw AppError.notFound('Listing');

    const audience = audienceFor(principal, property);

    // A listing that is not live is visible only to the broker who owns it and to admins.
    // The same 404 as a missing one: whether a rejected listing exists is not public.
    const isPublic = (['approved', 'sold', 'rented'] as PropertyStatus[]).includes(
      property.status as PropertyStatus,
    );
    if (!isPublic && audience !== 'owner') throw AppError.notFound('Listing');

    // The owner reading their own page is not an interested buyer, so it is not a view.
    if (audience !== 'owner') {
      await PropertyModel.updateOne({ _id: property._id }, { $inc: { viewsCount: 1 } });
    }

    // A signed-in visitor is about to be handed the broker's number. Recorded once per
    // buyer per listing per day — it is what lets a broker be told how many people took
    // their details, and what would make metering possible later without inventing history.
    if (audience === 'user' && principal.kind === 'user') {
      await recordContactUnlock(principal.id, property, req.ip ?? null);
    }

    res.json({
      data: serializeProperty(property, audience),
      actions: actionsFor(property, principal),
    });
  } catch (error) {
    next(error);
  }
});

propertyRouter.patch('/:id', requireRole('broker', 'admin'), async (req, res, next) => {
  try {
    const user = userOf(req);
    const property = await updateProperty(String(req.params.id), user, req.body);

    await recordAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'property.update',
      subjectType: 'property',
      subjectId: property.id,
      metadata: { fields: Object.keys(req.body ?? {}) },
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    res.json({
      data: serializeProperty(property, 'owner'),
      actions: actionsFor(property, principalOf(req)),
    });
  } catch (error) {
    next(error);
  }
});

/** Submit, approve, reject, withdraw, mark sold — all one endpoint, one state machine. */
propertyRouter.post('/:id/status', requireRole('broker', 'admin'), async (req, res, next) => {
  try {
    const user = userOf(req);
    const { action, reason } = statusChangeSchema.parse(req.body);

    const property = await changeStatus(String(req.params.id), user, action, reason, notifier(), {
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    res.json({
      data: serializeProperty(property, 'owner'),
      actions: actionsFor(property, principalOf(req)),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * A buyer asking about a listing. It lives here rather than in the buyer router because
 * the resource is the listing — and because a router guarding a shared prefix guards
 * everything under it, which is a trap this file already avoids.
 */
propertyRouter.post('/:id/enquiries', requireUser, async (req, res, next) => {
  try {
    const result = await sendEnquiry(userOf(req).id, String(req.params.id), req.body, notifier());
    res.status(202).json({
      sent: true,
      id: result.id,
      message: 'Your message is with the broker. They usually reply within a day.',
    });
  } catch (error) {
    next(error);
  }
});

/** The homepage carousel. An administrator decides what is featured, never the broker. */
propertyRouter.post('/:id/featured', requireRole('admin'), async (req, res, next) => {
  try {
    const user = userOf(req);
    const { isFeatured } = z.object({ isFeatured: z.boolean() }).strict().parse(req.body);

    const property = await PropertyModel.findOne({ _id: req.params.id, deletedAt: null });
    if (!property) throw AppError.notFound('Listing');
    if (property.status !== 'approved' && isFeatured) {
      throw new AppError(
        'INVALID_STATE_TRANSITION',
        'Only a live listing can be featured.',
      );
    }

    property.isFeatured = isFeatured;
    await property.save();

    await recordAudit({
      actorId: user.id,
      actorRole: user.role,
      action: isFeatured ? 'property.feature' : 'property.unfeature',
      subjectType: 'property',
      subjectId: property.id,
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    res.json({ data: serializeProperty(property, 'owner') });
  } catch (error) {
    next(error);
  }
});
