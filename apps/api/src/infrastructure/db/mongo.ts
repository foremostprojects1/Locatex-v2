import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { logger } from '../observability/logger.js';

/**
 * Mongoose is configured strictly on purpose.
 *
 * v1 lost every uploaded 7/12, 8A and Utarotar document because the controller assigned
 * fields the schema did not declare and Mongoose dropped them in silence. `strict: 'throw'`
 * and `strictQuery: 'throw'` turn that class of bug into a loud failure at development time.
 */
mongoose.set('strict', 'throw');
mongoose.set('strictQuery', 'throw');
mongoose.set('sanitizeFilter', true);
mongoose.set('runValidators', true);

export async function connectMongo(uri = env().MONGODB_URI): Promise<typeof mongoose> {
  mongoose.connection.on('connected', () => logger.info('mongo connected'));
  mongoose.connection.on('disconnected', () => logger.warn('mongo disconnected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'mongo error'));

  await mongoose.connect(uri, {
    dbName: env().MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
  });
  return mongoose;
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

export const isMongoHealthy = (): boolean => mongoose.connection.readyState === 1;
