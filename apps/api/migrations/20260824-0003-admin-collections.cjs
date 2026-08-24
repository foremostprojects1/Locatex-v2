/* eslint-disable */
/**
 * The collections the administrator's dashboard reads: messages from the contact form, and
 * the timed news items.
 *
 * Created here rather than left to Mongoose so a deploy never builds an index in the
 * foreground against a live collection — the same reason as the property indexes.
 */
module.exports = {
  async up(db) {
    await db.createCollection('contact_messages');
    await db.collection('contact_messages').createIndexes([
      { key: { status: 1, _id: -1 }, name: 'inbox' },
      { key: { email: 1, createdAt: -1 }, name: 'sender_history' },
    ]);

    await db.createCollection('news_items');
    await db.collection('news_items').createIndexes([
      // The public query: active, started, not yet finished.
      { key: { isActive: 1, startsAt: -1, endsAt: 1 }, name: 'live_window' },
      { key: { isPinned: -1, startsAt: -1 }, name: 'pinned_first' },
    ]);

    await db.createCollection('property_drafts');
    await db
      .collection('property_drafts')
      .createIndexes([{ key: { brokerId: 1, updatedAt: -1 }, name: 'broker_drafts' }]);
  },

  async down(db) {
    await db.collection('contact_messages').drop();
    await db.collection('news_items').drop();
    await db.collection('property_drafts').drop();
  },
};
