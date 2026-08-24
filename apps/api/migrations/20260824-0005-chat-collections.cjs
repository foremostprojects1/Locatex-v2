/* eslint-disable */
/**
 * Conversations and their messages.
 *
 * Created here rather than left to Mongoose so a deploy never builds an index in the
 * foreground against a live collection.
 */
module.exports = {
  async up(db) {
    await db.createCollection('chat_threads');
    await db.collection('chat_threads').createIndexes([
      // One conversation per buyer per listing. Starting a second from a different page
      // would split the history in half.
      { key: { propertyId: 1, buyerId: 1 }, name: 'one_per_buyer', unique: true },
      { key: { brokerId: 1, lastMessageAt: -1 }, name: 'broker_inbox' },
      { key: { buyerId: 1, lastMessageAt: -1 }, name: 'buyer_inbox' },
      // The digest job's query: something unread, nothing sent about it yet.
      { key: { lastMessageAt: 1, digestSentAt: 1 }, name: 'digest_candidates' },
    ]);

    await db.createCollection('chat_messages');
    await db.collection('chat_messages').createIndexes([
      { key: { threadId: 1, _id: -1 }, name: 'thread_page' },
      // The per-minute flood check counts a sender's recent messages.
      { key: { senderId: 1, createdAt: -1 }, name: 'sender_recent' },
    ]);
  },

  async down(db) {
    await db.collection('chat_threads').drop();
    await db.collection('chat_messages').drop();
  },
};
