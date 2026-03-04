/**
 * Worker process — optional for heavy async jobs.
 *
 * The backend (apps/backend) already has built-in cron jobs via @nestjs/schedule
 * for retries, sync, and commissions. This worker is for more complex job
 * queue scenarios using BullMQ + Redis.
 *
 * Jobs:
 * - provision-esim: called after an order is paid; creates the provider order
 *   and polls for the eSIM profile.
 * - sync-usage: periodically syncs all active eSIM profile usage from provider.
 * - send-email: queues and retries transactional email delivery.
 *
 * Configuration:
 * - Set REDIS_URL in .env (default: redis://localhost:6379)
 * - Worker shares DATABASE_URL and ESIMLAUNCH_API_KEY with backend.
 */

import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

// ---------------------------------------------------------------------------
// Queue definitions (export for backend to enqueue jobs)
// ---------------------------------------------------------------------------
export const provisionQueue = new Queue('provision-esim', { connection });
export const syncUsageQueue = new Queue('sync-usage', { connection });
export const sendEmailQueue = new Queue('send-email', { connection });

// ---------------------------------------------------------------------------
// Workers
// ---------------------------------------------------------------------------

new Worker(
  'provision-esim',
  async (job) => {
    console.log(`[worker] provision-esim: orderId=${job.data.orderId}`);
    // TODO: import OrdersService logic here or call backend internal API
    // This is a placeholder — implement provisioning logic as needed.
  },
  { connection },
);

new Worker(
  'sync-usage',
  async (job) => {
    console.log(`[worker] sync-usage: profileId=${job.data.profileId}`);
    // TODO: sync eSIM usage from provider
  },
  { connection },
);

new Worker(
  'send-email',
  async (job) => {
    console.log(`[worker] send-email: to=${job.data.to} template=${job.data.template}`);
    // TODO: send email via nodemailer/SMTP
  },
  { connection },
);

console.log('Worker started. Listening for jobs…');
