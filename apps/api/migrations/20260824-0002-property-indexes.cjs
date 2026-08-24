/* eslint-disable */
/**
 * The `properties` collection and every index a listing search depends on.
 *
 * These duplicate the ones declared on the Mongoose schema deliberately. Mongoose builds
 * indexes on first use, which is fine on a laptop and wrong on Atlas — the first request
 * after a deploy would trigger a foreground build against a live collection. Creating them
 * here means a deploy is `migrate:up` then start, and the application never builds an index
 * while serving traffic.
 */
module.exports = {
  async up(db) {
    await db.createCollection('properties');

    await db.collection('properties').createIndexes([
      // Browse: always pinned to a status, then narrowed by place, sorted by id (ULID = time).
      { key: { status: 1, 'location.district': 1, _id: -1 }, name: 'browse_district' },
      {
        key: { status: 1, 'location.district': 1, 'location.taluka': 1, _id: -1 },
        name: 'browse_taluka',
      },
      { key: { status: 1, propertyType: 1, listingType: 1, _id: -1 }, name: 'browse_type' },

      // Keyset pagination for the two non-default sorts.
      { key: { status: 1, pricePaise: 1, _id: 1 }, name: 'sort_price' },
      { key: { status: 1, areaSqft: -1, _id: -1 }, name: 'sort_area' },

      // The broker dashboard and the homepage carousel.
      { key: { brokerId: 1, status: 1, _id: -1 }, name: 'broker_listings' },
      { key: { status: 1, isFeatured: -1, _id: -1 }, name: 'featured' },

      { key: { 'location.pincode': 1 }, name: 'pincode' },
      { key: { areaSqft: 1 }, name: 'area' },

      // Radius search. Sparse: a listing whose pincode has not been geocoded yet has no
      // point at all, and must not occupy space in the geo index.
      { key: { geo: '2dsphere' }, name: 'geo', sparse: true },

      // Free text over what a person types into a search box.
      {
        key: { title: 'text', description: 'text', 'location.address': 'text' },
        name: 'property_text',
        weights: { title: 10, 'location.address': 4, description: 1 },
      },
    ]);
  },

  async down(db) {
    await db.collection('properties').drop();
  },
};
