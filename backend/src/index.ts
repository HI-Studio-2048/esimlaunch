import express from 'express';
import cors from 'cors';
import { env } from './config/env';

const app = express();

// Middleware
const allowedOrigins = env.corsOrigin.split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
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
app.use(express.json({ limit: '10mb' }));
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
  console.error('Error:', err);
  
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Environment: ${env.nodeEnv}`);
  console.log(`🌐 API Base URL: ${env.apiBaseUrl}`);
  console.log(`🔒 CORS Allowed Origins: ${allowedOrigins.join(', ')}`);
});

