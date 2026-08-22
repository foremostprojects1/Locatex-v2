import { Redis } from 'ioredis';
import { env } from '../../config/env.js';

/**
 * BullMQ requires `maxRetriesPerRequest: null` on its connection — with a retry limit the
 * blocking commands a worker uses are cancelled and jobs silently stop being processed.
 */
export function createRedisConnection(url = env().REDIS_URL): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  });
}

export async function pingRedis(url = env().REDIS_URL): Promise<boolean> {
  const client = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
  try {
    await client.connect();
    return (await client.ping()) === 'PONG';
  } catch {
    return false;
  } finally {
    client.disconnect();
  }
}
