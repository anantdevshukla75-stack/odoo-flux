import { checkDatabaseConnection } from '../../config/database.js';
import { checkRedisConnection } from '../../config/redis.js';
import env from '../../config/environment.js';

export class HealthService {
  /**
   * Evaluates overall system health, checking DB, Redis, and runtime stats
   */
  static async getSystemHealth() {
    const [dbCheck, redisCheck] = await Promise.all([
      checkDatabaseConnection(),
      checkRedisConnection()
    ]);

    const isHealthy = dbCheck.ok && redisCheck.ok;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      services: {
        database: {
          status: dbCheck.ok ? 'connected' : 'disconnected',
          latencyMs: dbCheck.latencyMs ?? null,
          error: dbCheck.ok ? undefined : 'Database unreachable'
        },
        redis: {
          status: redisCheck.ok ? 'connected' : 'disconnected',
          latencyMs: redisCheck.latencyMs ?? null,
          error: redisCheck.ok ? undefined : 'Redis unreachable'
        }
      },
      system: {
        nodeVersion: process.version,
        memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024))
      }
    };
  }
}

export default HealthService;
