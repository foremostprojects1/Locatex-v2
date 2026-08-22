import { Queue, type JobsOptions } from 'bullmq';
import { createRedisConnection } from './connection.js';
import { env } from '../../config/env.js';

/**
 * Every asynchronous job the system runs. Named here so a queue is never created by a
 * string literal at a call site, and so the worker and the producers cannot drift apart.
 *
 * `email` carries the twelve templates; `chatDigest` carries the 24-hour unread reminder;
 * `drive` retries Google Drive operations; `maintenance` runs cleanup.
 */
export const QUEUE_NAMES = ['email', 'chatDigest', 'drive', 'maintenance'] as const;
export type QueueName = (typeof QUEUE_NAMES)[number];

/** Sensible defaults: retry with backoff, and do not let completed jobs grow forever. */
export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: { age: 7 * 24 * 3600, count: 1_000 },
  removeOnFail: { age: 30 * 24 * 3600 },
};

const registry = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  let queue = registry.get(name);
  if (!queue) {
    queue = new Queue(name, {
      connection: createRedisConnection(),
      prefix: env().QUEUE_PREFIX,
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
    registry.set(name, queue);
  }
  return queue;
}

export async function closeQueues(): Promise<void> {
  await Promise.all([...registry.values()].map((queue) => queue.close()));
  registry.clear();
}
