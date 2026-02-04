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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use('/api/auth', authRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/v1', apiRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stores', storeRoutes);

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

