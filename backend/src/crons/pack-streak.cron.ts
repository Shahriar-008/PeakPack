// ══════════════════════════════════════════════════════════════
// PeakPack — Pack Streak Cron (Step 13)
// Runs daily at 00:01 UTC
// ══════════════════════════════════════════════════════════════

import cron from 'node-cron';
import { logger } from '../lib/logger';
import { checkPackStreak } from '../services/streak.service';

/**
 * 00:01 UTC daily — checks each pack to see if all members checked in yesterday.
 * If yes: increment pack streak + award bonus XP to all members.
 * If no: reset pack streak.
 */
export function startPackStreakCron(): cron.ScheduledTask {
  const task = cron.schedule('1 0 * * *', async () => {
    logger.info('[CRON] pack-streak: starting');
    const start = Date.now();

    try {
      await checkPackStreak();

      logger.info('[CRON] pack-streak: complete', {
        durationMs: Date.now() - start,
      });
    } catch (err) {
      logger.error('[CRON] pack-streak: failed', { error: err });
    }
  }, { timezone: 'UTC' });

  logger.info('[CRON] pack-streak scheduled: 00:01 UTC daily');
  return task;
}
