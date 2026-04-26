// ══════════════════════════════════════════════════════════════
// PeakPack — Weekly Recap Job Worker (Step 12)
// ══════════════════════════════════════════════════════════════

import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { queueEmail } from './queue';
import { getISOWeek } from '../services/leaderboard.service';
import type { RecapJobData } from './queue';

// ── Worker ────────────────────────────────────────────────────

export function createRecapWorker(): Worker {
  const worker = new Worker<RecapJobData>(
    'recaps',
    async (job: Job<RecapJobData>) => {
      const { userId, weekStart, weekEnd } = job.data;

      logger.debug('Processing recap job', { jobId: job.id, userId });

      const start = new Date(weekStart);
      const end   = new Date(weekEnd);

      // ── Gather stats ────────────────────────────────────────

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, name: true, email: true, streak: true,
          packMembership: { select: { packId: true } },
        },
      });

      if (!user) {
        logger.warn('Recap: user not found', { userId });
        return;
      }

      // Weekly XP from Redis
      const isoWeek = getISOWeek(start);
      let weeklyXP = 0;
      try {
        const score = await redis.zscore(`leaderboard:global:${isoWeek}`, userId);
        weeklyXP = score ? parseInt(score, 10) : 0;
      } catch {
        // Fall back to DB if Redis unavailable
        const xpEvents = await prisma.xPEvent.findMany({
          where: { userId, createdAt: { gte: start, lte: end } },
          select: { xp: true },
        });
        weeklyXP = xpEvents.reduce((sum, e) => sum + e.xp, 0);
      }

      // Check-ins this week
      const checkIns = await prisma.checkIn.count({
        where: { userId, date: { gte: start, lte: end } },
      });

      // Badges earned this week
      const badgesEarned = await prisma.badge.count({
        where: { userId, earnedAt: { gte: start, lte: end } },
      });

      // Pack rank (from Redis)
      let packRank: number | null = null;
      if (user.packMembership?.packId) {
        try {
          const rankRaw = await redis.zrevrank(
            `leaderboard:pack:${user.packMembership.packId}:${isoWeek}`,
            userId
          );
          packRank = rankRaw !== null ? rankRaw + 1 : null;
        } catch {
          // ignore
        }
      }

      // ── Queue email ─────────────────────────────────────────

      await queueEmail({
        to:   user.email,
        type: 'weekly_recap',
        payload: {
          name:         user.name,
          weeklyXP,
          checkIns,
          streak:       user.streak,
          badgesEarned,
          packRank,
        },
      });

      logger.info('Recap job processed', {
        jobId: job.id,
        userId,
        weeklyXP,
        checkIns,
        badgesEarned,
        packRank,
      });
    },
    {
      connection:  redis,
      concurrency: 10,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error('Recap job failed', {
      jobId: job?.id,
      error: err.message,
      userId: job?.data?.userId,
    });
  });

  worker.on('error', (err) => {
    logger.error('Recap worker error', { error: err.message });
  });

  logger.info('Recap worker started');
  return worker;
}
