import Redis from 'ioredis';
import env from './environment.js';
import logger from '../utils/logger.js';

let redisClient = null;

export function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      retryStrategy(times) {
        if (env.NODE_ENV === 'test') {
          return null; // Don't retry endlessly in tests
        }
        const delay = Math.min(times * 200, 3000);
        logger.warn(`Redis disconnected, retrying connection in ${delay}ms...`);
        return delay;
      },
      lazyConnect: true
    });

    redisClient.on('error', (err) => {
      logger.error({ err: err.message }, 'Redis client error');
    });

    redisClient.on('connect', () => {
      logger.info('Redis connection established');
    });
  }
  return redisClient;
}

export const redis = getRedisClient();

/**
 * Checks Redis connectivity using PING
 * @returns {Promise<{ ok: boolean, latencyMs?: number, error?: string }>}
 */
export async function checkRedisConnection() {
  const start = Date.now();
  try {
    const client = getRedisClient();
    if (client.status === 'wait') {
      await client.connect();
    }
    const pong = await client.ping();
    const latencyMs = Date.now() - start;
    return { ok: pong === 'PONG', latencyMs };
  } catch (error) {
    logger.error({ err: error.message }, 'Redis connection check failed');
    return { ok: false, error: error.message };
  }
}

/**
 * Gracefully disconnects Redis client
 */
export async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    } catch (err) {
      logger.error({ err: err.message }, 'Error closing Redis connection');
    }
  }
}

export default redis;
