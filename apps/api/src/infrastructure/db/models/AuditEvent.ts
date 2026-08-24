import { Schema, model } from 'mongoose';
import { ulid } from 'ulid';

/**
 * Append-only record of who did what to whom. MongoDB does not enforce referential
 * integrity, so this is the trail that lets an approval, a rejection or an account change
 * be reconstructed months later — including the ones a bug got wrong.
 *
 * Nothing here is ever updated or deleted; the collection and its indexes are created by
 * the `20260816-0001` migration.
 */
const auditEventSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },
    actorId: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    subjectType: { type: String, required: true },
    subjectId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: 'throw',
    versionKey: false,
    collection: 'audit_events',
  },
);

export const AuditEventModel = model('AuditEvent', auditEventSchema);

export interface AuditEntry {
  actorId: string;
  actorRole: string;
  action: string;
  subjectType: string;
  subjectId: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Recording an audit event must never be the reason a user's action fails: the write is
 * awaited so ordering is deterministic in tests, but a failure is logged rather than
 * thrown. Losing the trail is bad; losing the approval that the trail describes is worse.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await AuditEventModel.create(entry);
  } catch (error) {
    const { logger } = await import('../../observability/logger.js');
    logger.error({ err: error, action: entry.action }, 'failed to record an audit event');
  }
}
