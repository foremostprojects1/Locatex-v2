import {
  findTransition,
  type PropertyAction,
  type PropertyStatus,
  type Role,
  type TransitionActor,
} from '@locatex/contracts';
import { AppError } from '../../shared/AppError.js';

/**
 * The only place a listing's status is allowed to change.
 *
 * The table of legal moves lives in the contracts package so the web app can render the
 * right buttons; this module is what actually enforces it, and every refusal is a specific
 * error rather than a silent no-op.
 */

export interface StatusActor {
  id: string;
  role: Role;
}

export interface StatusChangeResult {
  from: PropertyStatus;
  to: PropertyStatus;
  action: PropertyAction;
  actor: TransitionActor;
  reason: string | null;
  at: Date;
}

/**
 * How this user relates to this listing. An admin is an admin even on a listing they own,
 * because the admin powers are a superset — but ownership is checked first so a broker
 * acting on their own listing is never mistaken for an administrator.
 */
export function actorFor(
  property: { brokerId: string },
  user: StatusActor,
): TransitionActor | null {
  if (user.role === 'admin') return 'admin';
  if (property.brokerId === user.id && user.role === 'broker') return 'owner';
  return null;
}

/**
 * Validates a move and returns what should be recorded. Deliberately pure: it does not
 * touch the document, so the caller decides when to persist and can do it inside the same
 * transaction as the audit event.
 */
export function planStatusChange(
  property: { brokerId: string; status: PropertyStatus; listingType: string },
  action: PropertyAction,
  user: StatusActor,
  reason?: string,
): StatusChangeResult {
  const actor = actorFor(property, user);
  if (!actor) {
    throw new AppError('NOT_OWNER', 'This listing belongs to another broker.');
  }

  const transition = findTransition(property.status, action);
  if (!transition) {
    throw new AppError(
      'INVALID_STATE_TRANSITION',
      `A listing that is ${describe(property.status)} cannot be ${describeAction(action)}.`,
    );
  }

  if (!transition.by.includes(actor)) {
    throw AppError.forbidden(
      actor === 'owner'
        ? 'Only an administrator can do that.'
        : 'You do not have access to this.',
    );
  }

  // "Sold" and "rented" are not interchangeable: a rental that reports itself sold would
  // disappear from the rent search and never come back.
  if (action === 'mark-sold' && property.listingType !== 'sale') {
    throw new AppError('INVALID_STATE_TRANSITION', 'A rental listing is marked rented, not sold.');
  }
  if (action === 'mark-rented' && property.listingType !== 'rent') {
    throw new AppError('INVALID_STATE_TRANSITION', 'A sale listing is marked sold, not rented.');
  }

  const trimmed = reason?.trim();
  if (transition.requiresReason && (!trimmed || trimmed.length < 5)) {
    throw AppError.validation(
      [{ field: 'reason', code: 'required', message: 'Give the broker a reason.' }],
      `A reason is required when you ${describeAction(action)} a listing.`,
    );
  }

  return {
    from: property.status,
    to: transition.to,
    action,
    actor,
    reason: trimmed ?? null,
    at: new Date(),
  };
}

const STATUS_WORDS: Record<PropertyStatus, string> = {
  draft: 'still a draft',
  pending: 'waiting for review',
  approved: 'live',
  rejected: 'rejected',
  sold: 'marked sold',
  rented: 'marked rented',
  withdrawn: 'withdrawn',
};

const ACTION_WORDS: Record<PropertyAction, string> = {
  submit: 'submitted',
  publish: 'published',
  approve: 'approved',
  reject: 'rejected',
  withdraw: 'withdrawn',
  'mark-sold': 'marked sold',
  'mark-rented': 'marked rented',
  relist: 'relisted',
  revoke: 'pulled back for review',
};

const describe = (status: PropertyStatus): string => STATUS_WORDS[status];
const describeAction = (action: PropertyAction): string => ACTION_WORDS[action];
