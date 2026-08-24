import mongoose from 'mongoose';
import {
  PUBLIC_STATUSES,
  enquirySchema,
  type EnquiryInput,
  type EnquiryStatus,
} from '@locatex/contracts';
import {
  ContactUnlockModel,
  EnquiryModel,
} from '../../infrastructure/db/models/Buyer.js';
import { PropertyModel } from '../../infrastructure/db/models/Property.js';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { AppError } from '../../shared/AppError.js';
import type { EmailSender } from '../ports/notifications.js';

/**
 * A buyer asking a broker about a listing, and the record that the buyer was shown the
 * broker's number.
 */

/**
 * Records that this buyer was given this broker's contact details.
 *
 * One row per buyer, per listing, per day. Without the day in the key, a buyer refreshing
 * a page ten times would look like ten interested people and the number a broker sees would
 * mean nothing. Failure here never blocks the page — the listing is what the buyer came for.
 */
export async function recordContactUnlock(
  userId: string,
  property: { _id?: unknown; brokerId: string },
  ip?: string | null,
): Promise<void> {
  const propertyId = String(property._id);
  if (userId === property.brokerId) return; // A broker looking at their own listing.

  try {
    await ContactUnlockModel.create({
      userId,
      propertyId,
      brokerId: property.brokerId,
      day: new Date().toISOString().slice(0, 10),
      ip: ip ?? null,
    });
  } catch (error) {
    if (isDuplicate(error)) return; // Already seen today.
    const { logger } = await import('../../infrastructure/observability/logger.js');
    logger.warn({ err: error, propertyId }, 'could not record a contact unlock');
  }
}

/** How many separate buyers took this broker's number, for their own dashboard. */
export async function unlockCountForBroker(brokerId: string, sinceDays = 30): Promise<number> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const rows = await ContactUnlockModel.aggregate<{ _id: null; buyers: string[] }>([
    { $match: { brokerId, createdAt: { $gte: since } } },
    { $group: { _id: null, buyers: { $addToSet: '$userId' } } },
  ]);
  return rows[0]?.buyers.length ?? 0;
}

export async function sendEnquiry(
  buyerId: string,
  propertyId: string,
  input: EnquiryInput,
  email: EmailSender,
): Promise<{ id: string }> {
  const data = enquirySchema.parse(input);

  const property = await PropertyModel.findOne({
    _id: propertyId,
    deletedAt: null,
    status: mongoose.trusted({ $in: [...PUBLIC_STATUSES] }),
  })
    .select('_id brokerId title contact status')
    .lean();

  if (!property) throw AppError.notFound('Listing');

  if (property.brokerId === buyerId) {
    throw new AppError('CONFLICT', 'This is your own listing.');
  }

  // Repeating the same question every hour is not more likely to get an answer, and a
  // broker with forty copies of one message stops reading any of them.
  const recent = await EnquiryModel.countDocuments({
    buyerId,
    propertyId,
    createdAt: mongoose.trusted({ $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) }),
  });
  if (recent > 0) {
    throw new AppError(
      'CONFLICT',
      'You have already asked about this listing today. The broker has your message.',
    );
  }

  const [buyer, record] = await Promise.all([
    UserModel.findOne({ _id: buyerId, deletedAt: null }).select('fullName email phone').lean(),
    EnquiryModel.create({
      propertyId,
      brokerId: property.brokerId,
      buyerId,
      message: data.message,
      channel: data.channel,
      callbackPhone: data.callbackPhone ?? null,
    }),
  ]);

  const broker = await UserModel.findOne({ _id: property.brokerId, deletedAt: null })
    .select('fullName email')
    .lean();

  if (broker && buyer) {
    await email.send({
      to: broker.email,
      template: 'enquiry-received',
      data: {
        fullName: broker.fullName,
        title: property.title,
        propertyId: String(property._id),
        buyerName: buyer.fullName,
        // The broker needs a way to answer; that is the whole point of the enquiry.
        buyerPhone: data.callbackPhone ?? buyer.phone,
        buyerEmail: buyer.email,
        message: data.message.slice(0, 500),
      },
    });
  }

  return { id: record.id };
}

export async function listEnquiriesForBroker(brokerId: string, status?: EnquiryStatus) {
  return EnquiryModel.find(status ? { brokerId, status } : { brokerId })
    .sort({ _id: -1 })
    .limit(100)
    .lean();
}

export async function listEnquiriesForBuyer(buyerId: string) {
  return EnquiryModel.find({ buyerId }).sort({ _id: -1 }).limit(100).lean();
}

export async function setEnquiryStatus(
  enquiryId: string,
  brokerId: string,
  status: EnquiryStatus,
): Promise<void> {
  const enquiry = await EnquiryModel.findById(enquiryId);
  if (!enquiry) throw AppError.notFound('Enquiry');
  if (enquiry.brokerId !== brokerId) {
    throw new AppError('NOT_OWNER', 'That enquiry was sent to another broker.');
  }

  enquiry.status = status;
  if (status === 'read') enquiry.readAt ??= new Date();
  if (status === 'replied') enquiry.repliedAt = new Date();
  await enquiry.save();
}

const isDuplicate = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
