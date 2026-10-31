import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import env from './config/environment.js';
import logger from './utils/logger.js';
import globalRateLimiter from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import healthRoutes from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import productRoutes from './modules/products/product.routes.js';
import variantRoutes from './modules/products/variant.routes.js';
import planRoutes from './modules/plans/plan.routes.js';
import taxRoutes from './modules/taxes/tax.routes.js';

/**
 * Creates and configures the Express application
 */
export function createApp() {
  const app = express();

  // 1. Security Headers via Helmet
  app.use(helmet());

  // 2. CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      if (origin === env.FRONTEND_URL) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // 3. Structured Request Logging (pino-http)
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({
      logger,
      customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      autoLogging: {
        ignore: (req) => req.url === '/api/v1/health' // Keep health probes quiet in production logs
      }
    }));
  }

  // 4. Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 5. Global Rate Limiter
  app.use(globalRateLimiter);

  // 6. Base Root Route
  app.get('/', (req, res) => {
    res.json({
      name: 'Brightloop Software Subscription Management API',
      version: '1.0.0',
      status: 'online',
      docs: '/api/v1/health'
    });
  });

  // 7. API V1 Routes
  const apiRouter = express.Router();
  apiRouter.use(healthRoutes);
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/products', productRoutes);
  apiRouter.use('/variants', variantRoutes);
  apiRouter.use('/plans', planRoutes);
  apiRouter.use('/taxes', taxRoutes);

  // Future phase routes will be mounted here:
  // apiRouter.use('/auth', authRoutes);
  // apiRouter.use('/users', userRoutes);
  // apiRouter.use('/products', productRoutes);
  // apiRouter.use('/plans', planRoutes);
  // apiRouter.use('/quotations', quotationRoutes);
  // apiRouter.use('/subscriptions', subscriptionRoutes);
  // apiRouter.use('/taxes', taxRoutes);
  // apiRouter.use('/discounts', discountRoutes);
  // apiRouter.use('/invoices', invoiceRoutes);
  // apiRouter.use('/payments', paymentRoutes);
  // apiRouter.use('/dashboard', dashboardRoutes);

  app.use('/api/v1', apiRouter);

  // 8. 404 Route Not Found Handler
  app.use(notFoundHandler);

  // 9. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp();
