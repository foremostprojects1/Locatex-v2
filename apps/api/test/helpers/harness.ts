import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import type { Express } from 'express';
import { LoggingNotifier } from '../../src/application/ports/notifications.js';

/**
 * A real MongoDB for integration tests — in memory, started as a one-node replica set so
 * transactions behave exactly as they will against Atlas.
 */
let replSet: MongoMemoryReplSet | undefined;
let notifierInstance: LoggingNotifier | undefined;

export interface Harness {
  app: Express;
  outbox: LoggingNotifier;
}

export async function startHarness(): Promise<Harness> {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET ??= 'test-secret-'.padEnd(40, 'x');
  process.env.APP_BASE_URL ??= 'http://localhost:5173';

  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  process.env.MONGODB_URI = replSet.getUri();
  process.env.MONGODB_DB_NAME = 'locatex-test';

  const { resetEnvForTests } = await import('../../src/config/env.js');
  resetEnvForTests();

  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'locatex-test' });

  notifierInstance = new LoggingNotifier();
  const { setNotifier } = await import('../../src/container.js');
  setNotifier(notifierInstance);

  const { createApp } = await import('../../src/http/app.js');
  return { app: createApp(), outbox: notifierInstance };
}

export async function stopHarness(): Promise<void> {
  await mongoose.disconnect();
  await replSet?.stop();
  const { setNotifier } = await import('../../src/container.js');
  setNotifier(undefined);
}

/** Between tests: empty every collection but keep the connection and indexes. */
export async function resetDatabase(): Promise<void> {
  const collections = await mongoose.connection.db?.collections();
  await Promise.all((collections ?? []).map((collection) => collection.deleteMany({})));
  notifierInstance?.clear();
}
