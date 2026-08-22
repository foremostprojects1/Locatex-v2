/* eslint-disable */
// migrate-mongo reads plain CommonJS; the migrations themselves are CJS too.
require('dotenv').config();

module.exports = {
  mongodb: {
    url: process.env.MONGODB_URI,
    databaseName: process.env.MONGODB_DB_NAME || 'locatex',
    options: { serverSelectionTimeoutMS: 10000 },
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'migrations_changelog',
  migrationFileExtension: '.cjs',
  useFileHash: false,
  moduleSystem: 'commonjs',
};
