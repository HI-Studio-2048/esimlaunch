/**
 * Worker process — optional for heavy async job queues (BullMQ + Redis).
 *
 * Currently NOT required. The backend (apps/backend) handles all async
 * operations via @nestjs/schedule cron jobs:
 * - Order retries: CronModule retries failed orders
 * - Email delivery: EmailModule handles transactional emails
 * - Usage sync: handled by the main backend
 *
 * Enable this worker only if you need dedicated Redis-backed job queues
 * for high-volume processing (e.g., 1000+ orders/day).
 *
 * To enable:
 * 1. Set REDIS_URL in .env
 * 2. Implement the job processors below
 * 3. Run: npx ts-node src/index.ts
 */

console.log('Worker is disabled. All async jobs are handled by the backend cron module.');
console.log('See apps/backend/src/modules/cron/ for the active job processors.');
