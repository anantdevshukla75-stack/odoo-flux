import pino from 'pino';
import env from '../config/environment.js';

const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : (process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')),
  transport: !isProduction && !isTest ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  base: {
    service: 'brightloop-backend',
    env: env.NODE_ENV
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

export default logger;
