import { createApp } from './http/app.js';
import { env } from './config/env.js';
import { connectMongo, disconnectMongo } from './infrastructure/db/mongo.js';
import { logger } from './infrastructure/observability/logger.js';
import { attachRealtime, closeRealtime } from './infrastructure/realtime/gateway.js';

async function main(): Promise<void> {
  const config = env();
  await connectMongo();

  const server = createApp().listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'locatex api listening');
  });

  // Chat's real-time push. The REST endpoints are the feature; this only makes it instant,
  // so a failure to attach would degrade the product rather than break it.
  attachRealtime(server);

  const shutdown = (signal: string) => async () => {
    logger.info({ signal }, 'shutting down');
    closeRealtime();
    server.close(async () => {
      await disconnectMongo();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', shutdown('SIGTERM'));
  process.on('SIGINT', shutdown('SIGINT'));
}

main().catch((error) => {
  logger.fatal({ err: error }, 'failed to start');
  process.exit(1);
});
