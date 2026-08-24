/* eslint-disable */
/**
 * Saved listings, the record of who was shown which broker's number, and enquiries.
 *
 * Created here rather than left to Mongoose so a deploy never builds an index in the
 * foreground against a live collection.
 */
module.exports = {
  async up(db) {
    await db.createCollection('favourites');
    await db.collection('favourites').createIndexes([
      // Saving twice is saving once. Enforced here, not trusted to the interface: a double
      // tap on a slow connection genuinely sends the request twice.
      { key: { userId: 1, propertyId: 1 }, name: 'one_per_person', unique: true },
      { key: { userId: 1, _id: -1 }, name: 'newest_first' },
    ]);

    await db.createCollection('contact_unlocks');
    await db.collection('contact_unlocks').createIndexes([
      // One row per buyer per listing per day. Without the day, a buyer refreshing a page
      // ten times would look like ten interested people.
      { key: { userId: 1, propertyId: 1, day: 1 }, name: 'once_a_day', unique: true },
      { key: { brokerId: 1, createdAt: -1 }, name: 'broker_recent' },
    ]);

    await db.createCollection('enquiries');
    await db.collection('enquiries').createIndexes([
      { key: { brokerId: 1, status: 1, _id: -1 }, name: 'broker_inbox' },
      { key: { buyerId: 1, _id: -1 }, name: 'buyer_sent' },
      { key: { propertyId: 1, _id: -1 }, name: 'per_listing' },
    ]);
  },

  async down(db) {
    await db.collection('favourites').drop();
    await db.collection('contact_unlocks').drop();
    await db.collection('enquiries').drop();
  },
};
