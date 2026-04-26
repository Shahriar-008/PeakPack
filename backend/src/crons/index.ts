// ══════════════════════════════════════════════════════════════
// PeakPack — Cron Job Registry (Step 13)
// ══════════════════════════════════════════════════════════════

import cron from 'node-cron';
import { logger } from '../lib/logger';
import { startStreakResetCron }    from './streak-reset.cron';
import { startPackStreakCron }     from './pack-streak.cron';
import { startStreakReminderCron } from './streak-reminder.cron';
import { startWeeklyRecapCron }   from './weekly-recap.cron';
import { startBattleResolverCron } from './battle-resolver.cron';

let tasks: cron.ScheduledTask[] = [];

/**
 * Start all cron jobs.
 * Call once from index.ts after the server starts.
 */
export function startAllCrons(): void {
  tasks = [
    startPackStreakCron(),        // 00:01 UTC — pack streak check
    startStreakResetCron(),       // 00:05 UTC — user streak reset + notifications
    startWeeklyRecapCron(),       // Sunday 19:00 UTC — weekly recap emails
    startStreakReminderCron(),    // 20:00 UTC daily — streak at-risk reminders
    startBattleResolverCron(),   // Hourly — resolve expired battles
  ];

  logger.info(`[CRON] ${tasks.length} cron jobs registered`);
}

/**
 * Stop all running cron jobs gracefully.
 * Call during graceful shutdown.
 */
export function stopAllCrons(): void {
  tasks.forEach((task) => task.stop());
  tasks = [];
  logger.info('[CRON] All cron jobs stopped');
}
