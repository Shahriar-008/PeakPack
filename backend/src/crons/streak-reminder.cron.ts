// ══════════════════════════════════════════════════════════════
// PeakPack — Streak Reminder Cron (Step 13)
// Runs daily at 20:00 UTC (8 PM)
// ══════════════════════════════════════════════════════════════

import cron from 'node-cron';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { notifyStreakReminder } from '../services/notification.service';
import { queueEmail } from '../jobs/queue';

/**
 * 20:00 UTC daily — find users with an active streak who haven't checked in today.
 * Queue both in-app notification and email reminder.
 */
export function startStreakReminderCron(): cron.ScheduledTask {
  const task = cron.schedule('0 20 * * *', async () => {
    logger.info('[CRON] streak-reminder: starting');
    const start = Date.now();

    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Find users with active streak who haven't checked in today yet
      const usersAtRisk = await prisma.user.findMany({
        where: {
          streak: { gt: 0 },
          // User has NOT checked in today
          checkIns: {
            none: { date: today },
          },
          // Only notify if they want streak reminders (check notifyPrefs)
        },
        select: {
          id: true,
          name: true,
          email: true,
          streak: true,
          notifyPrefs: true,
        },
      });

      let notified = 0;
      for (const user of usersAtRisk) {
        const prefs = user.notifyPrefs as Record<string, boolean> | null;
        const wantsReminder = prefs?.streak_risk !== false; // default true

        if (!wantsReminder) continue;

        // In-app notification
        await notifyStreakReminder(user.id, user.streak);

        // Email reminder
        await queueEmail({
          to:   user.email,
          type: 'streak_reminder',
          payload: {
            name:   user.name,
            streak: user.streak,
          },
        });

        notified++;
      }

      logger.info('[CRON] streak-reminder: complete', {
        durationMs:  Date.now() - start,
        usersAtRisk: usersAtRisk.length,
        notified,
      });
    } catch (err) {
      logger.error('[CRON] streak-reminder: failed', { error: err });
    }
  }, { timezone: 'UTC' });

  logger.info('[CRON] streak-reminder scheduled: 20:00 UTC daily');
  return task;
}
