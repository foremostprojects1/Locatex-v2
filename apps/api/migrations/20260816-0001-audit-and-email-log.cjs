/* eslint-disable */
/**
 * The two cross-cutting collections every later phase writes to.
 *
 * `audit_events` is append-only: approvals, contact unlocks, document changes and account
 * status changes all land here, and it is the reconstruction trail that compensates for
 * MongoDB not enforcing referential integrity.
 *
 * `email_log` records every send so the admin can see what went out and what bounced.
 */
module.exports = {
  async up(db) {
    await db.createCollection('audit_events');
    await db.collection('audit_events').createIndexes([
      { key: { createdAt: -1 }, name: 'created_desc' },
      { key: { actorId: 1, createdAt: -1 }, name: 'actor_recent' },
      { key: { subjectType: 1, subjectId: 1, createdAt: -1 }, name: 'subject_recent' },
      { key: { action: 1, createdAt: -1 }, name: 'action_recent' },
    ]);

    await db.createCollection('email_log');
    await db.collection('email_log').createIndexes([
      { key: { createdAt: -1 }, name: 'created_desc' },
      { key: { template: 1, createdAt: -1 }, name: 'template_recent' },
      { key: { status: 1, createdAt: -1 }, name: 'status_recent' },
      // Redelivery guard: one send per (template, recipient, dedupeKey).
      {
        key: { template: 1, to: 1, dedupeKey: 1 },
        name: 'dedupe',
        unique: true,
        partialFilterExpression: { dedupeKey: { $type: 'string' } },
      },
    ]);
  },

  async down(db) {
    await db.collection('audit_events').drop();
    await db.collection('email_log').drop();
  },
};
