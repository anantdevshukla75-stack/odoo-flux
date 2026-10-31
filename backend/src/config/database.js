import { PrismaClient } from '@prisma/client';
import env from './environment.js';
import logger from '../utils/logger.js';

let prismaInstance = null;

export function getPrismaClient() {
  if (!prismaInstance) {
    const isDev = env.NODE_ENV === 'development';
    prismaInstance = new PrismaClient({
      log: isDev ? ['warn', 'error'] : ['error']
    });
  }
  return prismaInstance;
}

export const prisma = getPrismaClient();

/**
 * Verifies database connectivity using a lightweight query
 * @returns {Promise<{ ok: boolean, latencyMs?: number, error?: string }>}
 */
export async function checkDatabaseConnection() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return { ok: true, latencyMs };
  } catch (error) {
    logger.error({ err: error.message }, 'Database connection check failed');
    return { ok: false, error: error.message };
  }
}

/**
 * Gracefully disconnects Prisma client
 */
export async function disconnectDatabase() {
  if (prismaInstance) {
    try {
      await prismaInstance.$disconnect();
      logger.info('Database connection closed gracefully');
    } catch (err) {
      logger.error({ err: err.message }, 'Error closing database connection');
    }
  }
}

export default prisma;
