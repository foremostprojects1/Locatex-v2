/* eslint-disable */
/**
 * Documents, their upload sessions, and the single row describing the connected storage
 * account.
 */
module.exports = {
  async up(db) {
    await db.createCollection('property_documents');
    await db.collection('property_documents').createIndexes([
      { key: { propertyId: 1, status: 1 }, name: 'per_listing' },
      { key: { propertyId: 1, category: 1, version: -1 }, name: 'versions' },
      // The same bytes uploaded twice to one listing are one document, not two.
      {
        key: { propertyId: 1, checksum: 1 },
        name: 'dedupe',
        unique: true,
        partialFilterExpression: { checksum: { $type: 'string' } },
      },
    ]);

    await db.createCollection('upload_sessions');
    await db.collection('upload_sessions').createIndexes([
      { key: { documentId: 1 }, name: 'by_document' },
      // What the nightly sweep looks for.
      { key: { status: 1, expiresAt: 1 }, name: 'abandoned' },
    ]);

    await db.createCollection('storage_account');
  },

  async down(db) {
    await db.collection('property_documents').drop();
    await db.collection('upload_sessions').drop();
    await db.collection('storage_account').drop();
  },
};
