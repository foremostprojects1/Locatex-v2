import { startWorkers } from './infrastructure/queue/worker.js';
import { connectMongo, disconnectMongo } from './infrastructure/db/mongo.js';
import { logger } from './infrastructure/observability/logger.js';
import { closeQueues } from './infrastructure/queue/queues.js';

/** Second process from the same image: runs the queues, never serves HTTP. */
async function main(): Promise<void> {
  await connectMongo();
  const workers = startWorkers();
  logger.info({ queues: workers.length }, 'locatex worker started');

  const shutdown = async () => {
    await Promise.all(workers.map((worker) => worker.close()));
    await closeQueues();
    await disconnectMongo();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  logger.fatal({ err: error }, 'worker failed to start');
  process.exit(1);
});
