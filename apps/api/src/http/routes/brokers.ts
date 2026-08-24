import { Router, type Router as ExpressRouter } from 'express';
import mongoose from 'mongoose';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { PropertyModel } from '../../infrastructure/db/models/Property.js';
import { searchProperties } from '../../application/property/searchProperties.js';
import { audienceFor, serializeProperty } from '../../domain/property/serialize.js';
import { principalOf } from '../middleware/authenticate.js';
import { AppError } from '../../shared/AppError.js';

/**
 * A broker's public page.
 *
 * What is shown depends on who is looking, exactly as a listing does: a visitor sees who
 * the broker is and what they have for sale, but not how to ring them. The phone number is
 * the thing registration buys, and handing it over on a profile page would make every
 * listing's redaction pointless.
 */
export const brokerRouter: ExpressRouter = Router();

brokerRouter.get('/:id', async (req, res, next) => {
  try {
    const principal = principalOf(req);
    const signedIn = principal.kind === 'user';

    const broker = await UserModel.findOne({
      _id: String(req.params.id),
      role: 'broker',
      status: 'active',
      deletedAt: null,
    })
      .select('fullName email phone avatarUrl brokerProfile createdAt')
      .lean();

    if (!broker) throw AppError.notFound('Broker');

    // Counted rather than derived from the page of listings below, which is only the first
    // twenty-four of them.
    const [live, sold] = await Promise.all([
      PropertyModel.countDocuments({ brokerId: broker._id, status: 'approved', deletedAt: null }),
      PropertyModel.countDocuments({
        brokerId: broker._id,
        status: mongoose.trusted({ $in: ['sold', 'rented'] }),
        deletedAt: null,
      }),
    ]);

    const listings = await searchProperties(
      { ...req.query, sort: 'newest' },
      { brokerId: String(broker._id), statuses: ['approved'] },
    );

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({
      data: {
        id: String(broker._id),
        fullName: broker.fullName,
        avatarUrl: broker.avatarUrl ?? null,
        agencyName: broker.brokerProfile?.agencyName ?? null,
        district: broker.brokerProfile?.district ?? null,
        about: broker.brokerProfile?.about ?? null,
        experienceYears: broker.brokerProfile?.experienceYears ?? null,
        reraNumber: broker.brokerProfile?.reraNumber ?? null,
        officeAddress: signedIn ? (broker.brokerProfile?.officeAddress ?? null) : null,
        memberSince: broker.brokerProfile?.approvedAt ?? broker.createdAt,
        counts: { live, sold },
        // The same rule as a listing: contact details are for signed-in buyers only.
        contact: signedIn ? { email: broker.email, phone: broker.phone } : null,
      },
      listings: listings.items.map((item) =>
        serializeProperty(item, audienceFor(principal, item)),
      ),
      nextCursor: listings.nextCursor,
      total: listings.total,
    });
  } catch (error) {
    next(error);
  }
});
