import mongoose from 'mongoose';
import { adminUserQuerySchema } from '@locatex/contracts';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { logoutEverywhere } from '../auth/session.js';
import { AppError } from '../../shared/AppError.js';

/**
 * The people list, and the one destructive thing an administrator can do to an account.
 */
export async function listUsers(query: unknown) {
  const { role, status, q, limit, cursor } = adminUserQuerySchema.parse(query ?? {});

  const filter: Record<string, unknown> = { deletedAt: null };
  if (role) filter.role = role;
  if (status) filter.status = status;

  // A RegExp instance, not `{ $regex }` — `sanitizeFilter` rewrites the latter, and the
  // admin's search text is escaped before it becomes a pattern either way.
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ fullName: pattern }, { email: pattern }, { phone: pattern }];
  }
  if (cursor) filter._id = mongoose.trusted({ $lt: cursor });

  const rows = await UserModel.find(filter)
    .select('fullName email phone role status emailVerifiedAt phoneVerifiedAt lastLoginAt createdAt brokerProfile brokerApplication')
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return {
    data: items.map((user) => ({
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      isVerified: Boolean(user.emailVerifiedAt && user.phoneVerifiedAt),
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      agencyName: user.brokerProfile?.agencyName ?? null,
      brokerApplicationStatus: user.brokerApplication?.status ?? null,
    })),
    nextCursor: hasMore && last ? String(last._id) : null,
  };
}

/**
 * Suspending an account ends its sessions immediately.
 *
 * Raising the token version is what does it: access tokens carry the version they were
 * minted with, so every one already in circulation stops verifying on its next request.
 * Without this, a suspended user keeps working until their token happens to expire — which
 * is precisely the window in which someone suspended for cause does the damage.
 */
export async function setUserStatus(
  adminId: string,
  userId: string,
  status: 'active' | 'suspended',
): Promise<void> {
  if (adminId === userId) {
    throw new AppError('CONFLICT', 'You cannot change the status of your own account.');
  }

  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user) throw AppError.notFound('Account');

  // The last administrator must not be able to lock everyone out of the dashboard.
  if (user.role === 'admin' && status === 'suspended') {
    const others = await UserModel.countDocuments({
      role: 'admin',
      status: 'active',
      deletedAt: null,
      _id: mongoose.trusted({ $ne: userId }),
    });
    if (others === 0) {
      throw new AppError('CONFLICT', 'This is the only active administrator.');
    }
  }

  if (user.status === status) return;

  user.status = status;
  await user.save();

  if (status === 'suspended') await logoutEverywhere(user.id, 'suspended');
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
