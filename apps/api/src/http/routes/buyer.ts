import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { enquiryStatusSchema, favouriteListQuerySchema } from '@locatex/contracts';
import {
  addFavourite,
  favouriteIds,
  listFavourites,
  removeFavourite,
} from '../../application/buyer/favourites.js';
import {
  listEnquiriesForBroker,
  listEnquiriesForBuyer,
  setEnquiryStatus,
  unlockCountForBroker,
} from '../../application/buyer/enquiries.js';
import { serializeProperty } from '../../domain/property/serialize.js';
import { principalOf, requireRole, requireUser, userOf } from '../middleware/authenticate.js';

/**
 * What a signed-in person does with listings: save them, ask about them, and see what they
 * have asked.
 *
 * Two routers with their own prefixes rather than one at `/api/v1`. A router mounted on a
 * shared prefix with a blanket `use(requireUser)` guards *everything* below that prefix —
 * which is how the public contact form and the news endpoint briefly started returning 401.
 * A guard belongs on a path that is entirely private.
 */
export const meRouter: ExpressRouter = Router();
export const brokerAreaRouter: ExpressRouter = Router();

meRouter.use(requireUser);
brokerAreaRouter.use(requireRole('broker', 'admin'));

// ---------------------------------------------------------------------------
// Favourites
// ---------------------------------------------------------------------------

meRouter.get('/favourites', async (req, res, next) => {
  try {
    const { limit, cursor } = favouriteListQuerySchema.parse(req.query);
    const page = await listFavourites(userOf(req).id, { limit, cursor });
    const principal = principalOf(req);

    res.json({
      // Saved listings are shown to their owner, who is signed in — so the identified view,
      // not the guest one. Ownership of the *listing* still decides the fuller view.
      data: page.items.map((item) =>
        serializeProperty(
          item,
          principal.kind === 'user' && principal.id === item.brokerId ? 'owner' : 'user',
        ),
      ),
      nextCursor: page.nextCursor,
      total: page.total,
      unavailable: page.unavailable,
    });
  } catch (error) {
    next(error);
  }
});

/** Just the ids, so a grid can fill in its hearts without loading every saved listing. */
meRouter.get('/favourites/ids', async (req, res, next) => {
  try {
    res.json({ data: await favouriteIds(userOf(req).id) });
  } catch (error) {
    next(error);
  }
});

meRouter.put('/favourites/:propertyId', async (req, res, next) => {
  try {
    await addFavourite(userOf(req).id, String(req.params.propertyId));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

meRouter.delete('/favourites/:propertyId', async (req, res, next) => {
  try {
    await removeFavourite(userOf(req).id, String(req.params.propertyId));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------------

meRouter.get('/enquiries', async (req, res, next) => {
  try {
    const rows = await listEnquiriesForBuyer(userOf(req).id);
    res.json({
      data: rows.map((row) => ({
        id: String(row._id),
        propertyId: row.propertyId,
        message: row.message,
        channel: row.channel,
        status: row.status,
        createdAt: row.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

brokerAreaRouter.get('/enquiries', async (req, res, next) => {
  try {
    const status = enquiryStatusSchema.optional().parse(req.query.status as string | undefined);
    const rows = await listEnquiriesForBroker(userOf(req).id, status);

    res.json({
      data: rows.map((row) => ({
        id: String(row._id),
        propertyId: row.propertyId,
        buyerId: row.buyerId,
        message: row.message,
        channel: row.channel,
        callbackPhone: row.callbackPhone,
        status: row.status,
        createdAt: row.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

brokerAreaRouter.patch('/enquiries/:id', async (req, res, next) => {
  try {
    const { status } = z.object({ status: enquiryStatusSchema }).strict().parse(req.body);
    await setEnquiryStatus(String(req.params.id), userOf(req).id, status);
    res.json({ status });
  } catch (error) {
    next(error);
  }
});

/** The broker's own numbers: how many buyers took their details recently. */
brokerAreaRouter.get('/stats', async (req, res, next) => {
  try {
    const brokerId = userOf(req).id;
    const [unlocks, enquiries] = await Promise.all([
      unlockCountForBroker(brokerId),
      listEnquiriesForBroker(brokerId, 'new'),
    ]);
    res.json({ data: { contactUnlocks30Days: unlocks, newEnquiries: enquiries.length } });
  } catch (error) {
    next(error);
  }
});
