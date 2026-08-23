import {
  brokerApplicationSchema,
  type BrokerApplicationInput,
} from '@locatex/contracts';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { AppError } from '../../shared/AppError.js';
import { logoutEverywhere } from './session.js';
import type { EmailSender } from '../ports/notifications.js';

/**
 * A buyer asks to become a broker (decision D4). Nothing about the account changes here —
 * the role is granted by an admin, never by the applicant.
 */
export async function applyToBecomeBroker(
  userId: string,
  input: BrokerApplicationInput,
): Promise<void> {
  const data = brokerApplicationSchema.parse(input);
  const user = await UserModel.findOne({ _id: userId, deletedAt: null });
  if (!user) throw AppError.notFound('Account');

  if (user.role === 'broker') {
    throw new AppError('CONFLICT', 'You are already registered as a broker.');
  }
  if (user.brokerApplication?.status === 'pending') {
    throw new AppError('CONFLICT', 'Your application is already with our team for review.');
  }

  user.set('brokerApplication', {
    ...data,
    status: 'pending',
    submittedAt: new Date(),
  });
  await user.save();
}

/**
 * Admin decision. Approval is the one place a role changes, and it takes effect
 * immediately: raising the token version forces the applicant's next request to mint a
 * token carrying the new role, so they do not have to sign out and in to post land.
 */
export async function decideBrokerApplication(
  adminId: string,
  applicantId: string,
  decision: 'approve' | 'reject',
  reason: string | undefined,
  email: EmailSender,
): Promise<void> {
  const user = await UserModel.findOne({ _id: applicantId, deletedAt: null });
  if (!user) throw AppError.notFound('Applicant');
  if (!user.brokerApplication || user.brokerApplication.status !== 'pending') {
    throw new AppError('INVALID_STATE_TRANSITION', 'There is no pending application for this account.');
  }

  const application = user.brokerApplication;
  application.status = decision === 'approve' ? 'approved' : 'rejected';
  application.decidedAt = new Date();
  application.decidedBy = adminId;
  if (decision === 'reject') application.rejectionReason = reason;

  if (decision === 'approve') {
    user.role = 'broker';
    user.set('brokerProfile', {
      agencyName: application.agencyName,
      officeAddress: application.officeAddress,
      district: application.district,
      reraNumber: application.reraNumber,
      experienceYears: application.experienceYears,
      about: application.about,
      approvedAt: new Date(),
      approvedBy: adminId,
    });
  }

  await user.save();

  if (decision === 'approve') {
    await logoutEverywhere(user.id, 'role-changed');
  }

  await email.send({
    to: user.email,
    template: decision === 'approve' ? 'broker-approved' : 'broker-rejected',
    data: {
      fullName: user.fullName,
      ...(decision === 'reject' && reason ? { reason } : {}),
    },
  });
}
