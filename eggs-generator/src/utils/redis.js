import { createClient } from 'redis';
import { logger } from './logger.js';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;

/** 🚀 Redis Client */
export const redisClient = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
  },
});

/** 🛠 Handle Redis Connection */
redisClient.on('error', (err) => logger.error('❌ Redis Connection Failed:', err));

redisClient.connect().then(() => {
  logger.info(`✅ Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
});
