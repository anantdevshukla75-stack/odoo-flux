import app from './app.js';
import env from './config/environment.js';
import logger from './utils/logger.js';
import { checkDatabaseConnection, disconnectDatabase } from './config/database.js';
import { checkRedisConnection, disconnectRedis } from './config/redis.js';
import { closeAllQueues } from './jobs/queues.js';

let server = null;
let isShuttingDown = false;

async function startServer() {
  try {
    logger.info('Initializing Brightloop Software Subscription Backend...');

    // 1. Verify Database Connection
    logger.info('Checking database connectivity...');
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.ok) {
      logger.info(`✅ PostgreSQL connection established (${dbCheck.latencyMs}ms)`);
    } else {
      logger.warn(`⚠️ PostgreSQL connection warning: ${dbCheck.error || 'Connection failed'}. Retrying during operations.`);
    }

    // 2. Verify Redis Connection
    logger.info('Checking Redis connectivity...');
    const redisCheck = await checkRedisConnection();
    if (redisCheck.ok) {
      logger.info(`✅ Redis connection established (${redisCheck.latencyMs}ms)`);
    } else {
      logger.warn(`⚠️ Redis connection warning: ${redisCheck.error || 'Connection failed'}. Retrying during operations.`);
    }

    // 3. Start Express HTTP Server
    server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
      logger.info(`🔗 Base URL: ${env.APP_BASE_URL}`);
      logger.info(`🩺 Health check: ${env.APP_BASE_URL}/api/v1/health`);
    });

  } catch (error) {
    logger.fatal({ err: error.message, stack: error.stack }, '❌ Fatal error during server startup');
    process.exit(1);
  }
}

/**
 * Handles graceful shutdown on SIGINT / SIGTERM
 */
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new HTTP requests
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed. Releasing resources...');

      try {
        await closeAllQueues();
        await disconnectDatabase();
        await disconnectRedis();
        logger.info('All resources released cleanly. Exiting process.');
        process.exit(0);
      } catch (err) {
        logger.error({ err: err.message }, 'Error encountered during graceful shutdown cleanup');
        process.exit(1);
      }
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Shutdown timeout reached. Forcing immediate termination.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

// Process event listeners
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Promise Rejection caught at process level');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error.message, stack: error.stack }, 'Uncaught Exception caught at process level');
  gracefulShutdown('uncaughtException');
});

startServer();
