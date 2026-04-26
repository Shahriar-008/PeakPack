// ══════════════════════════════════════════════════════════════
// PeakPack — Streak Reset Cron (Step 13)
// Runs daily at 00:05 UTC
// ══════════════════════════════════════════════════════════════

import cron from 'node-cron';
import { logger } from '../lib/logger';
import { resetMissed } from '../services/streak.service';
import { notifyStreakBroken, notifyMany } from '../services/notification.service';
import { prisma } from '../lib/prisma';

/**
 * 00:05 UTC daily — find users who missed yesterday, apply freeze or break streak.
 * Also queues email + in-app notifications for broken streaks.
 */
export function startStreakResetCron(): cron.ScheduledTask {
  const task = cron.schedule('5 0 * * *', async () => {
    logger.info('[CRON] streak-reset: starting');
    const start = Date.now();

    try {
      // Get active streak users BEFORE reset (to identify who gets broken)
      const beforeReset = await prisma.user.findMany({
        where: { streak: { gt: 0 } },
        select: { id: true, streak: true, streakFreezes: true, email: true, name: true },
      });

      const { frozenCount, brokenCount } = await resetMissed();

      // Notify users whose streak was broken
      // Re-query after reset to find who went to 0
      if (brokenCount > 0) {
        const afterReset = await prisma.user.findMany({
          where: { id: { in: beforeReset.map((u) => u.id) }, streak: 0 },
          select: { id: true },
        });
        const brokenIds = new Set(afterReset.map((u) => u.id));

        for (const user of beforeReset) {
          if (brokenIds.has(user.id) && user.streakFreezes === 0) {
            await notifyStreakBroken(user.id, user.streak);
          }
        }
      }

      logger.info('[CRON] streak-reset: complete', {
        durationMs: Date.now() - start,
        frozenCount,
        brokenCount,
      });
    } catch (err) {
      logger.error('[CRON] streak-reset: failed', { error: err });
    }
  }, { timezone: 'UTC' });

  logger.info('[CRON] streak-reset scheduled: 00:05 UTC daily');
  return task;
}
