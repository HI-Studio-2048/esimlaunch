import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  apiBaseUrl: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  esimAccessApiUrl: string;
  esimAccessAccessCode: string;
  esimAccessSecretKey: string;
  redisUrl: string;
  corsOrigin: string;
  resendApiKey: string;
  resendFromEmail: string;
  frontendUrl: string;
  clerkSecretKey: string;
  clerkWebhookSecret: string;
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  stripeStarterPriceIdMonthly: string;
  stripeGrowthPriceIdMonthly: string;
  stripeScalePriceIdMonthly: string;
  stripeTestPriceIdMonthly: string;
  stripeTestPriceIdYearly: string;
  stripeStarterPriceIdYearly: string;
  stripeGrowthPriceIdYearly: string;
  stripeScalePriceIdYearly: string;
  mainDomain: string;
  allowedBaseDomain: string;
  adminEmail: string;
  affiliateCommissionRate: number;
  affiliateMinPayoutCents: number;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

export const env: EnvConfig = {
  port: parseInt(getEnvVar('PORT', '3000'), 10),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  apiBaseUrl: getEnvVar('API_BASE_URL', 'http://localhost:3000'),
  databaseUrl: getEnvVar('DATABASE_URL'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
  esimAccessApiUrl: getEnvVar('ESIM_ACCESS_API_URL', 'https://api.esimaccess.com'),
  esimAccessAccessCode: getEnvVar('ESIM_ACCESS_ACCESS_CODE'),
  esimAccessSecretKey: getEnvVar('ESIM_ACCESS_SECRET_KEY'),
  redisUrl: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
  corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:8080,http://localhost:5173,http://localhost:3001,http://localhost:3002'),
  resendApiKey: getEnvVar('RESEND_API_KEY', ''),
  resendFromEmail: getEnvVar('RESEND_FROM_EMAIL', 'noreply@esimlaunch.com'),
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:5173'),
  clerkSecretKey: getEnvVar('CLERK_SECRET_KEY', ''),
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET || '',
  stripeSecretKey: getEnvVar('STRIPE_SECRET_KEY', ''),
  stripePublishableKey: getEnvVar('STRIPE_PUBLISHABLE_KEY', ''),
  stripeWebhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET', ''),
  stripeStarterPriceIdMonthly: getEnvVar('STRIPE_STARTER_PRICE_ID_MONTHLY', ''),
  stripeGrowthPriceIdMonthly: getEnvVar('STRIPE_GROWTH_PRICE_ID_MONTHLY', ''),
  stripeScalePriceIdMonthly: getEnvVar('STRIPE_SCALE_PRICE_ID_MONTHLY', ''),
  stripeTestPriceIdMonthly: getEnvVar('STRIPE_TEST_PRICE_ID_MONTHLY', ''),
  stripeTestPriceIdYearly: getEnvVar('STRIPE_TEST_PRICE_ID_YEARLY', ''),
  stripeStarterPriceIdYearly: getEnvVar('STRIPE_STARTER_PRICE_ID_YEARLY', ''),
  stripeGrowthPriceIdYearly: getEnvVar('STRIPE_GROWTH_PRICE_ID_YEARLY', ''),
  stripeScalePriceIdYearly: getEnvVar('STRIPE_SCALE_PRICE_ID_YEARLY', ''),
  mainDomain: getEnvVar('MAIN_DOMAIN', 'esimlaunch.com'),
  allowedBaseDomain: getEnvVar('ALLOWED_BASE_DOMAIN', 'esimlaunch.com'),
  adminEmail: getEnvVar('ADMIN_EMAIL', 'admin@esimlaunch.com'),
  affiliateCommissionRate: (() => {
    const raw = parseFloat(getEnvVar('AFFILIATE_COMMISSION_RATE', '10'));
    return Number.isFinite(raw) && raw >= 0 && raw <= 100 ? raw : 10;
  })(),
  affiliateMinPayoutCents: (() => {
    const raw = parseInt(getEnvVar('AFFILIATE_MIN_PAYOUT_CENTS', '1000'), 10);
    return Number.isFinite(raw) && raw >= 0 ? raw : 1000;
  })(),
};

/**
 * Stripe API version pinned once and reused across every Stripe client instance
 * (payments, subscriptions, etc.) to avoid response-shape drift between callsites.
 */
export const STRIPE_API_VERSION = '2026-01-28.clover' as const;

// Warn on startup if critical secrets are missing in production
if (env.nodeEnv === 'production') {
  const criticalSecrets: Array<[string, string]> = [
    ['STRIPE_SECRET_KEY', env.stripeSecretKey],
    ['STRIPE_WEBHOOK_SECRET', env.stripeWebhookSecret],
    ['RESEND_API_KEY', env.resendApiKey],
    ['CLERK_SECRET_KEY', env.clerkSecretKey],
    ['CLERK_WEBHOOK_SECRET', env.clerkWebhookSecret],
    ['ESIM_ACCESS_SECRET_KEY', env.esimAccessSecretKey],
    ['ESIM_ACCESS_ACCESS_CODE', env.esimAccessAccessCode],
  ];
  for (const [name, value] of criticalSecrets) {
    if (!value) {
      console.warn(`⚠️  WARNING: ${name} is not set. Related features will not work in production.`);
    }
  }

  const devCorsOrigins = env.corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter((o) => /localhost|127\.0\.0\.1/.test(o));
  if (devCorsOrigins.length) {
    console.warn(
      `⚠️  WARNING: CORS_ORIGIN contains dev/localhost entries in production: ${devCorsOrigins.join(', ')}`
    );
  }
}
