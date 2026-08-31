import type { PropertyAction } from '@locatex/contracts';
import { PropertyModel, type PropertyDoc } from '../../infrastructure/db/models/Property.js';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { recordAudit } from '../../infrastructure/db/models/AuditEvent.js';
import { planStatusChange, type StatusActor } from '../../domain/property/status.js';
import { AppError } from '../../shared/AppError.js';
import type { EmailSender } from '../ports/notifications.js';

/**
 * Every move a listing makes through its lifecycle, and everything that must happen
 * alongside it: the history entry, the audit event and the email.
 *
 * The decision of whether a move is legal is not made here — `planStatusChange` owns that,
 * from a table. This function is only the consequences.
 */
export async function changeStatus(
  propertyId: string,
  user: StatusActor,
  action: PropertyAction,
  reason: string | undefined,
  email: EmailSender,
  request?: { ip?: string | null; userAgent?: string | null },
): Promise<PropertyDoc> {
  const property = await PropertyModel.findOne({ _id: propertyId, deletedAt: null });
  if (!property) throw AppError.notFound('Listing');

  const plan = planStatusChange(property, action, user, reason);

  // Publishing skips review, not the completeness check — a half-written listing must
  // not go live just because an administrator wrote it.
  if (action === 'submit' || action === 'publish') assertSubmittable(property);

  property.status = plan.to;
  property.statusHistory.push({
    from: plan.from,
    to: plan.to,
    action: plan.action,
    byUserId: user.id,
    byRole: user.role,
    reason: plan.reason,
    at: plan.at,
  });

  applyStamps(property, action, user.id, plan.reason, plan.at);
  await property.save();

  await recordAudit({
    actorId: user.id,
    actorRole: user.role,
    action: `property.${action}`,
    subjectType: 'property',
    subjectId: property.id,
    metadata: { from: plan.from, to: plan.to, reason: plan.reason },
    ip: request?.ip ?? null,
    userAgent: request?.userAgent ?? null,
  });

  await notify(property, action, plan.reason, email);
  return property;
}

/**
 * The bar for review is the one v1 enforced (decision D2): a title, a price, an area, a
 * location and a way to reach the seller. v1 required no documents, so neither do we —
 * adding a requirement the client never had would silently strand every migrated listing.
 */
function assertSubmittable(property: PropertyDoc): void {
  const missing: string[] = [];
  if (!property.title?.trim()) missing.push('a title');
  if (!(property.pricePaise > 0)) missing.push('an asking price');
  if (!(property.areaSqft > 0)) missing.push('the area');
  if (!property.location?.district || !property.location?.pincode) missing.push('the location');
  if (!property.contact?.phone || !property.contact?.email) missing.push('contact details');

  if (missing.length > 0) {
    throw new AppError(
      'PROPERTY_NOT_SUBMITTABLE',
      `This listing still needs ${missing.join(', ')}.`,
    );
  }
}

function applyStamps(
  property: PropertyDoc,
  action: PropertyAction,
  actorId: string,
  reason: string | null,
  at: Date,
): void {
  switch (action) {
    case 'submit':
      property.submittedAt = at;
      property.rejectionReason = null;
      break;
    case 'publish':
    case 'approve':
      property.approvedAt = at;
      property.approvedBy = actorId;
      property.rejectionReason = null;
      // Set once: the publication date is when buyers first saw it, and a later edit or
      // a relist must not make an old listing look new in a "newest first" sort.
      property.publishedAt ??= at;
      break;
    case 'reject':
      property.rejectionReason = reason;
      break;
    case 'revoke':
      property.rejectionReason = reason;
      property.approvedAt = null;
      property.approvedBy = null;
      break;
    default:
      break;
  }
}

/**
 * Who hears about it. A submission goes to the administrators because it is now their
 * queue; a decision goes to the broker because it is now their listing again.
 */
async function notify(
  property: PropertyDoc,
  action: PropertyAction,
  reason: string | null,
  email: EmailSender,
): Promise<void> {
  if (action === 'submit') {
    const admins = await UserModel.find({ role: 'admin', status: 'active', deletedAt: null })
      .select('email fullName')
      .lean();

    await Promise.all(
      admins.map((admin) =>
        email.send({
          to: admin.email,
          template: 'property-submitted',
          data: {
            fullName: admin.fullName,
            propertyId: property.id,
            title: property.title,
            district: property.location.district,
          },
        }),
      ),
    );
    return;
  }

  // Nobody is told about a publish: the administrator who did it is the only party, and
  // emailing them their own action is noise.
  if (action !== 'approve' && action !== 'reject') return;

  const broker = await UserModel.findOne({ _id: property.brokerId, deletedAt: null })
    .select('email fullName')
    .lean();
  if (!broker) return;

  await email.send({
    to: broker.email,
    template: action === 'approve' ? 'property-approved' : 'property-rejected',
    data: {
      fullName: broker.fullName,
      propertyId: property.id,
      title: property.title,
      ...(reason ? { reason } : {}),
    },
  });
}
