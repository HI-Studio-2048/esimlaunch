import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';

// Global safety net: async errors in webhooks, cron, and background tasks
// would otherwise kill the Node process without a stack trace.
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'uncaught exception');
});

const app = express();

// Trust first proxy (Railway, Vercel, etc.) so req.ip returns the real client IP
app.set('trust proxy', 1);

// HSTS: tell browsers to always use HTTPS. Prod-only so local dev on
// http://localhost keeps working.
if (env.nodeEnv === 'production') {
  app.use((_req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
}

/** CORS allowlist: CORS_ORIGIN + FRONTEND_URL + https apex/www for ALLOWED_BASE_DOMAIN (fixes www vs non-www). */
function buildAllowedCorsOrigins(): string[] {
  const set = new Set<string>(
    env.corsOrigin
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  );
  const fe = env.frontendUrl?.trim();
  if (fe) set.add(fe);
  const base = env.allowedBaseDomain.replace(/^www\./i, '').trim();
  if (base) {
    set.add(`https://${base}`);
    set.add(`https://www.${base}`);
  }
  return [...set];
}

// Middleware
const allowedOrigins = buildAllowedCorsOrigins();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (origin.endsWith('.vercel.app') && origin.includes('esimlaunch')) {
      // Allow Vercel preview deployments (e.g. esimlaunch-xxx-ezza-wans-projects.vercel.app)
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
}));
// Note: Webhook routes need raw body, so they're handled in the route itself
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    // Preserve raw body for webhook signature verification (Stripe, Clerk)
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Store router middleware (detects domain/subdomain and loads store)
// Note: This is optional - can be handled on frontend or via reverse proxy
// import { storeRouter } from './middleware/storeRouter';
// app.use(storeRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
import authRoutes from './routes/auth';
import apiKeyRoutes from './routes/apiKeys';
import apiRoutes from './routes/api';
import webhookRoutes from './routes/webhooks';
import dashboardRoutes from './routes/dashboard';
import storeRoutes from './routes/stores';
import paymentRoutes from './routes/payments';
import customerOrderRoutes from './routes/customerOrders';
import customerRoutes from './routes/customers';
import subscriptionRoutes from './routes/subscriptions';
import supportRoutes from './routes/support';
import currencyRoutes from './routes/currency';
import analyticsRoutes from './routes/analytics';
import seoRoutes from './routes/seo';
import emailTemplateRoutes from './routes/emailTemplates';
import affiliateRoutes from './routes/affiliates';
import balanceRoutes from './routes/balance';
import preferencesRoutes from './routes/preferences';
import adminRoutes from './routes/admin';
import voyageAdapterRoutes from './routes/voyageAdapter';
import integrationRoutes from './routes/integration';

app.use('/api/auth', authRoutes);
app.use('/api/merchant/preferences', preferencesRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/v1', apiRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/customer-orders', customerOrderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/voyage', voyageAdapterRoutes);
app.use('/api/integration', integrationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'eSIM Launch API',
    version: '1.0.0',
    docs: `${env.apiBaseUrl}/api-docs`
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, path: req.path, method: req.method }, 'request error');
  
  // If it's a CORS error, send proper CORS headers
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      errorCode: 'CORS_ERROR',
      errorMessage: 'Not allowed by CORS',
    });
    return;
  }
  
  res.status(err.status || 500).json({
    success: false,
    errorCode: err.errorCode || 'INTERNAL_ERROR',
    errorMessage: err.message || 'Internal server error',
  });
});

const PORT = env.port;

async function start() {
  // Fail fast if the DB is unreachable — otherwise /health returns 200 while
  // every real request crashes on first Prisma call.
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    logger.fatal({ err }, 'database connection check failed on startup');
    process.exit(1);
  }

  const server = app.listen(PORT, async () => {
    logger.info(
      {
        port: PORT,
        env: env.nodeEnv,
        apiBaseUrl: env.apiBaseUrl,
        corsAllowedOrigins: allowedOrigins,
      },
      'server started'
    );

    // Run cleanup on startup and every 24 hours
    const { sessionService } = await import('./services/sessionService');
    sessionService.cleanupExpired().catch((err) => logger.error({ err }, 'initial cleanup failed'));
    const cleanupInterval = setInterval(() => {
      sessionService
        .cleanupExpired()
        .catch((err) => logger.error({ err }, 'scheduled cleanup failed'));
    }, 24 * 60 * 60 * 1000);

    // Run monthly challenge evaluation every 6 hours; internal idempotency makes this safe.
    const { runMonthlyChallengeJob } = await import('./jobs/monthlyChallengeJob');
    const challengeInterval = setInterval(() => {
      runMonthlyChallengeJob().catch((err) => logger.error({ err }, 'monthly challenge job failed'));
    }, 6 * 60 * 60 * 1000);

    // Also run once on startup so missed months get paid out after a deploy
    runMonthlyChallengeJob().catch((err) => logger.error({ err }, 'monthly challenge initial run failed'));

    const shutdown = (signal: string) => {
      logger.info({ signal }, 'shutting down gracefully');
      clearInterval(cleanupInterval);
      clearInterval(challengeInterval);
      server.close(() => process.exit(0));
      // Force exit if close hangs
      setTimeout(() => process.exit(0), 10_000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  });
}

start().catch((err) => {
  logger.fatal({ err }, 'fatal startup error');
  process.exit(1);
});

