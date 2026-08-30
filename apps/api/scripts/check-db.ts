/**
 * Answers one question before a deploy: can this process reach its database, and what is
 * already in it?
 *
 *   pnpm db:check
 *
 * Worth having as its own command because the three ways this fails look identical from
 * the application — a wrong password, an IP that is not allow-listed, and a hostname that
 * does not resolve all surface as "connection error" — and each needs a different fix.
 */
// Must come first: it populates the environment that later imports read.
import '../src/config/loadEnvFile.js';

import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

const REDACT = /:\/\/([^:]+):([^@]+)@/;

async function main(): Promise<void> {
  const config = env();
  const uri = config.MONGODB_URI;

  if (uri.includes('CLUSTER-HOST')) {
    console.error(
      'MONGODB_URI still has the CLUSTER-HOST placeholder in it.\n' +
        'Get the real hostname from Atlas → Connect → Drivers; it looks like\n' +
        'cluster0.ab1cd.mongodb.net, and the middle part is unique to your project.',
    );
    process.exit(1);
  }

  console.warn(`connecting to ${uri.replace(REDACT, '://$1:••••@')}`);
  console.warn(`database     ${config.MONGODB_DB_NAME}`);

  try {
    await mongoose.connect(uri, {
      dbName: config.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 10_000,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\ncould not connect: ${message}\n`);

    // The three usual causes, and what each one actually needs.
    if (/authentication failed|bad auth/i.test(message)) {
      console.error('The username or password is wrong. Atlas → Database Access.');
    } else if (/ENOTFOUND|querySrv/i.test(message)) {
      console.error('That hostname does not resolve. Check it against Atlas → Connect.');
    } else if (/timed out|ETIMEDOUT|ServerSelection/i.test(message)) {
      console.error(
        "Reached the network but not the cluster. This is almost always the IP allow-list:\n" +
          'Atlas → Network Access → add this machine, or the server you are deploying to.',
      );
    }
    process.exit(1);
  }

  const admin = mongoose.connection.db;
  const collections = (await admin?.listCollections().toArray()) ?? [];

  console.warn('\nconnected.\n');

  if (collections.length === 0) {
    console.warn('The database is empty — nothing has been migrated or seeded here yet.');
  } else {
    console.warn(`${collections.length} collections:`);
    for (const collection of collections.sort((a, b) => a.name.localeCompare(b.name))) {
      const count = await admin?.collection(collection.name).countDocuments();
      console.warn(`  ${collection.name.padEnd(24)} ${count} document${count === 1 ? '' : 's'}`);
    }
  }

  // A replica set is not optional: the submit and approve flows use transactions, and a
  // standalone MongoDB refuses them outright. Every Atlas tier is one; a local install is
  // usually not, and that difference only shows up at the first approval.
  const status = await admin?.admin().command({ hello: 1 }).catch(() => null);
  const replicaSet = status?.setName;
  console.warn(
    replicaSet
      ? `\nreplica set "${replicaSet}" — transactions will work.`
      : '\n⚠ not a replica set. Transactions are refused, so submitting and approving a ' +
          'listing will fail. Atlas is always a replica set; a plain local mongod is not.',
  );

  await mongoose.disconnect();
}

await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
