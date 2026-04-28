// ══════════════════════════════════════════════════════════════
// PeakPack — Notification Job Worker (Step 12)
// ══════════════════════════════════════════════════════════════

import { Worker, Job } from 'bullmq';
import { redis, createBullMQConnection } from '../lib/redis';
import { logger } from '../lib/logger';
import { emitToUser } from '../lib/socket';
import type { NotificationJobData } from './queue';

// ── Worker ────────────────────────────────────────────────────

export function createNotificationWorker(): Worker {
  const connection = createBullMQConnection();

  const worker = new Worker<NotificationJobData>(
    'notifications',
    async (job: Job<NotificationJobData>) => {
      const { userId, type, title, message, meta } = job.data;

      logger.debug('Processing notification job', {
        jobId: job.id,
        type,
        userId,
      });

      // 1. Persist to Redis as a simple list (since we don't have a Notification
      //    DB model yet — full Prisma model comes in a future pass).
      //    Key: notifications:{userId}  — LPUSH, trim to 50
      const notifKey = `notifications:${userId}`;
      const notif = JSON.stringify({
        id:        job.id,
        type,
        title,
        message,
        meta:      meta ?? {},
        read:      false,
        createdAt: new Date().toISOString(),
      });

      await redis.lpush(notifKey, notif);
      await redis.ltrim(notifKey, 0, 49); // keep latest 50
      await redis.expire(notifKey, 30 * 24 * 60 * 60); // 30 days TTL

      // 2. Push real-time via Socket.IO to the user's personal room
      try {
        emitToUser(userId, 'notification:new', {
          type,
          title,
          message,
          meta: meta ?? {},
        });
      } catch {
        // Socket may not be initialised in test/cron context — safe to ignore
      }

      logger.info('Notification processed', { jobId: job.id, userId, type });
    },
    {
      connection,
      concurrency: 20,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error('Notification job failed', {
      jobId: job?.id,
      error: err.message,
      data:  job?.data,
    });
  });

  worker.on('error', (err) => {
    logger.error('Notification worker error', { error: err.message });
  });

  logger.info('Notification worker started');
  return worker;
}
