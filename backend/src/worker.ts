// ══════════════════════════════════════════════════════════════
// PeakPack — Standalone BullMQ Worker Entry Point
// Used by the `worker` Docker service (separate from the API).
// This keeps CPU-heavy email/notification work off the API process.
// ══════════════════════════════════════════════════════════════

import { logger }                 from './lib/logger';
import { redis }                  from './lib/redis';
import { prisma }                 from './lib/prisma';
import { createNotificationWorker } from './jobs/notification.job';
import { createEmailWorker }        from './jobs/email.job';
import { createRecapWorker }        from './jobs/recap.job';
import { closeQueues }              from './jobs/queue';

logger.info('🔧 PeakPack Worker starting...');

// ── Start all BullMQ workers ──────────────────────────────────

const notificationWorker = createNotificationWorker();
const emailWorker        = createEmailWorker();
const recapWorker        = createRecapWorker();

logger.info('✅ All workers running');

// ── Graceful shutdown ─────────────────────────────────────────

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down workers...`);

  await Promise.allSettled([
    notificationWorker.close(),
    emailWorker.close(),
    recapWorker.close(),
  ]);

  logger.info('Workers closed');

  await closeQueues();
  logger.info('Queues closed');

  try {
    await prisma.$disconnect();
    logger.info('Prisma disconnected');
  } catch (e) {
    logger.error('Error disconnecting Prisma', { error: e });
  }

  try {
    redis.disconnect();
    logger.info('Redis disconnected');
  } catch (e) {
    logger.error('Error disconnecting Redis', { error: e });
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection in worker', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception in worker', { error: error.message, stack: error.stack });
  process.exit(1);
});
