import { PROPERTY_STATUSES, ROLES, type AdminStats } from '@locatex/contracts';
import { PropertyModel } from '../../infrastructure/db/models/Property.js';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { ContactMessageModel } from '../../infrastructure/db/models/ContactMessage.js';

/**
 * The numbers on the admin's dashboard.
 *
 * Counted with aggregations rather than a `countDocuments` per status: seven round trips to
 * answer one card is the kind of thing that is fine on day one and embarrassing at ten
 * thousand listings. Every bucket is initialised to zero, so a status nobody has used yet
 * still appears — a missing card reads as a bug, an honest zero does not.
 */
export async function adminStats(): Promise<AdminStats> {
  const [listingBuckets, userBuckets, contactNew, contactTotal, brokerApplications] =
    await Promise.all([
      PropertyModel.aggregate<{ _id: string; count: number }>([
        { $match: { deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      UserModel.aggregate<{ _id: string; count: number }>([
        { $match: { deletedAt: null } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      ContactMessageModel.countDocuments({ status: 'new' }),
      ContactMessageModel.countDocuments({}),
      UserModel.countDocuments({ 'brokerApplication.status': 'pending', deletedAt: null }),
    ]);

  const listings = zeroed(PROPERTY_STATUSES, listingBuckets);
  const users = zeroed(ROLES, userBuckets);

  return {
    listings,
    pendingApprovals: listings.pending ?? 0,
    users,
    contactMessages: { new: contactNew, total: contactTotal },
    brokerApplications,
  };
}

const zeroed = (
  keys: readonly string[],
  buckets: Array<{ _id: string; count: number }>,
): Record<string, number> => {
  const counts = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const bucket of buckets) counts[bucket._id] = bucket.count;
  return counts;
};
