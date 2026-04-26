// ══════════════════════════════════════════════════════════════
// PeakPack — Weekly Recap Cron (Step 13)
// Runs every Sunday at 19:00 UTC
// ══════════════════════════════════════════════════════════════

import cron from 'node-cron';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { queueRecap } from '../jobs/queue';

/**
 * 19:00 UTC every Sunday — enqueue a weekly recap job for every active user.
 * The recap worker computes stats and dispatches the email.
 */
export function startWeeklyRecapCron(): cron.ScheduledTask {
  const task = cron.schedule('0 19 * * 0', async () => {
    logger.info('[CRON] weekly-recap: starting');
    const start = Date.now();

    try {
      const now   = new Date();
      const weekEnd   = new Date(now);
      weekEnd.setUTCHours(19, 0, 0, 0);

      const weekStart = new Date(weekEnd);
      weekStart.setUTCDate(weekStart.getUTCDate() - 7);

      // Get all users who want recap emails
      const users = await prisma.user.findMany({
        select: { id: true, notifyPrefs: true },
      });

      let queued = 0;
      for (const user of users) {
        const prefs = user.notifyPrefs as Record<string, boolean> | null;
        const wantsRecap = prefs?.weekly_recap !== false; // default true

        if (!wantsRecap) continue;

        await queueRecap({
          userId:    user.id,
          weekStart: weekStart.toISOString(),
          weekEnd:   weekEnd.toISOString(),
        });
        queued++;
      }

      logger.info('[CRON] weekly-recap: complete', {
        durationMs: Date.now() - start,
        totalUsers: users.length,
        queued,
      });
    } catch (err) {
      logger.error('[CRON] weekly-recap: failed', { error: err });
    }
  }, { timezone: 'UTC' });

  logger.info('[CRON] weekly-recap scheduled: 19:00 UTC Sundays');
  return task;
}
