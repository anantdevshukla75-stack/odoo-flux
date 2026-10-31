import { Queue, Worker, QueueEvents } from 'bullmq';
import env from '../config/environment.js';
import logger from '../utils/logger.js';

// BullMQ connection options directly from REDIS_URL
const redisConnection = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null
};

// Queue Names
export const QUEUE_NAMES = {
  BILLING: 'recurring-billing-queue',
  EMAIL: 'transactional-email-queue',
  PDF: 'invoice-pdf-generation-queue'
};

const registeredQueues = new Map();

/**
 * Creates or retrieves a BullMQ Queue
 * @param {string} queueName
 * @returns {Queue}
 */
export function getOrCreateQueue(queueName) {
  if (!registeredQueues.has(queueName)) {
    const queue = new Queue(queueName, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: {
          count: 500,
          age: 60 * 60 * 24 * 7 // 7 days
        },
        removeOnFail: {
          count: 1000,
          age: 60 * 60 * 24 * 30 // 30 days
        }
      }
    });

    queue.on('error', (err) => {
      logger.error({ queue: queueName, err: err.message }, 'Queue error encountered');
    });

    registeredQueues.set(queueName, queue);
  }
  return registeredQueues.get(queueName);
}

// Pre-instantiated shared queues for web & background processes
export const billingQueue = getOrCreateQueue(QUEUE_NAMES.BILLING);
export const emailQueue = getOrCreateQueue(QUEUE_NAMES.EMAIL);
export const pdfQueue = getOrCreateQueue(QUEUE_NAMES.PDF);

/**
 * Helper to register a BullMQ Worker
 * @param {string} queueName
 * @param {Function} processor
 * @param {object} [workerOptions={}]
 * @returns {Worker}
 */
export function createWorker(queueName, processor, workerOptions = {}) {
  const worker = new Worker(queueName, processor, {
    connection: redisConnection,
    concurrency: 5,
    ...workerOptions
  });

  worker.on('completed', (job) => {
    logger.info({ queue: queueName, jobId: job.id, name: job.name }, 'Job completed successfully');
  });

  worker.on('failed', (job, err) => {
    logger.error({ queue: queueName, jobId: job?.id, name: job?.name, err: err.message }, 'Job failed');
  });

  return worker;
}

/**
 * Gracefully closes all initialized BullMQ queues
 */
export async function closeAllQueues() {
  for (const [name, queue] of registeredQueues.entries()) {
    try {
      await queue.close();
      logger.info(`Queue ${name} closed successfully`);
    } catch (err) {
      logger.error({ queue: name, err: err.message }, 'Error closing queue');
    }
  }
  registeredQueues.clear();
}
