import pino from 'pino';

/**
 * Structured logger with automatic redaction of common secret fields.
 * Use this instead of `console.log` / `console.error` in server code so
 * that logs are JSON-structured in prod (grep-able, shipable to Loki/
 * Datadog/etc.) and sensitive fields never leak.
 *
 * Usage:
 *   import { logger } from '../lib/logger';
 *   logger.info({ merchantId, orderId }, 'order created');
 *   logger.error({ err }, 'webhook processing failed');
 *
 * The `err` serializer captures stack traces automatically when you pass
 * `{ err }` — prefer that over stringifying the error yourself.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  // In dev, pretty-print to the console. In prod, JSON lines go to stdout
  // so the hosting provider (Railway) can aggregate them.
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
        },
  redact: {
    paths: [
      'password',
      '*.password',
      'token',
      '*.token',
      'authorization',
      '*.authorization',
      'Authorization',
      'headers.authorization',
      'headers.cookie',
      'req.headers.authorization',
      'req.headers.cookie',
      'apiKey',
      '*.apiKey',
      'secret',
      '*.secret',
      'stripeSecretKey',
      'clerkSecretKey',
      'jwtSecret',
    ],
    censor: '[REDACTED]',
  },
});
