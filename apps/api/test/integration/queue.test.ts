import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Worker } from 'bullmq';

import { randomUUID } from 'node:crypto';

process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017';
process.env.JWT_SECRET ??= 'x'.repeat(32);
// A namespace of its own, so leftover jobs from an earlier run — or a dev worker running
// alongside — can never be mistaken for this test's job.
process.env.QUEUE_PREFIX = `test-${randomUUID()}`;

const { pingRedis } = await import('../../src/infrastructure/queue/connection.js');
const redisUp = await pingRedis();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Skipped rather than failed when Redis is not running locally — CI provides one. */
describe.skipIf(!redisUp)('job queue', () => {
  let workers: Worker[] = [];

  beforeAll(async () => {
    const { startWorkers } = await import('../../src/infrastructure/queue/worker.js');
    workers = startWorkers();
  });

  afterAll(async () => {
    const { closeQueues, getQueue, QUEUE_NAMES } = await import(
      '../../src/infrastructure/queue/queues.js'
    );
    await Promise.all(workers.map((worker) => worker.close()));
    // Leave no keys behind in the developer's Redis.
    await Promise.all(QUEUE_NAMES.map((name) => getQueue(name).obliterate({ force: true })));
    await closeQueues();
  });

  it('round-trips a job through Redis and back', async () => {
    const { getQueue } = await import('../../src/infrastructure/queue/queues.js');
    const queue = getQueue('maintenance');
    const job = await queue.add('ping', { from: 'test' });

    for (let attempt = 0; attempt < 60; attempt++) {
      const state = await (await queue.getJob(job.id!))?.getState();
      if (state === 'completed') {
        // Re-read after the state check: the snapshot taken while the job was still
        // active carries no return value yet.
        const finished = await queue.getJob(job.id!);
        expect(finished!.returnvalue).toMatchObject({ pong: true });
        return;
      }
      if (state === 'failed') throw new Error('job failed');
      await sleep(250);
    }
    throw new Error('job did not complete within 15s');
  }, 20_000);

  it('retries with backoff rather than dropping work', async () => {
    const { DEFAULT_JOB_OPTIONS } = await import('../../src/infrastructure/queue/queues.js');
    expect(DEFAULT_JOB_OPTIONS.attempts).toBeGreaterThan(1);
    expect(DEFAULT_JOB_OPTIONS.backoff).toMatchObject({ type: 'exponential' });
  });
});
