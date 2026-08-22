import { Worker, type Job } from 'bullmq';
import { createRedisConnection } from './connection.js';
import { QUEUE_NAMES, type QueueName } from './queues.js';
import { logger } from '../observability/logger.js';
import { env } from '../../config/env.js';

/**
 * Job handlers are registered here as each feature lands. Until then every queue has a
 * handler that logs and succeeds, so the worker process is real and observable from day one.
 */
export type JobHandler = (job: Job) => Promise<unknown>;

const handlers: Partial<Record<QueueName, Record<string, JobHandler>>> = {
  maintenance: {
    ping: async (job) => ({ pong: true, at: new Date().toISOString(), id: job.id }),
  },
};

export function registerHandler(queue: QueueName, jobName: string, handler: JobHandler): void {
  handlers[queue] ??= {};
  (handlers[queue] as Record<string, JobHandler>)[jobName] = handler;
}

export function startWorkers(): Worker[] {
  return QUEUE_NAMES.map((name) => {
    const worker = new Worker(
      name,
      async (job) => {
        const handler = handlers[name]?.[job.name];
        if (!handler) {
          logger.warn({ queue: name, job: job.name }, 'no handler registered — skipping');
          return { skipped: true };
        }
        return handler(job);
      },
      { connection: createRedisConnection(), prefix: env().QUEUE_PREFIX, concurrency: 5 },
    );

    worker.on('failed', (job, error) =>
      logger.error({ queue: name, job: job?.name, attempt: job?.attemptsMade, err: error }, 'job failed'),
    );
    worker.on('completed', (job) => logger.debug({ queue: name, job: job.name }, 'job completed'));

    return worker;
  });
}
