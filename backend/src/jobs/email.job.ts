// ══════════════════════════════════════════════════════════════
// PeakPack — Email Job Worker (Step 12)
// ══════════════════════════════════════════════════════════════

import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import {
  sendWelcomeEmail,
  sendStreakReminderEmail,
  sendStreakBrokenEmail,
  sendBadgeUnlockedEmail,
  sendWeeklyRecapEmail,
} from '../services/email.service';
import type { EmailJobData } from './queue';

// ── Worker ────────────────────────────────────────────────────

export function createEmailWorker(): Worker {
  const worker = new Worker<EmailJobData>(
    'emails',
    async (job: Job<EmailJobData>) => {
      const { to, type, payload } = job.data;

      logger.debug('Processing email job', { jobId: job.id, type, to });

      switch (type) {
        case 'welcome':
          await sendWelcomeEmail(to, payload.name as string);
          break;

        case 'streak_reminder':
          await sendStreakReminderEmail(
            to,
            payload.name   as string,
            payload.streak as number
          );
          break;

        case 'streak_broken':
          await sendStreakBrokenEmail(
            to,
            payload.name      as string,
            payload.wasStreak as number
          );
          break;

        case 'badge_unlocked':
          await sendBadgeUnlockedEmail(
            to,
            payload.name        as string,
            payload.badgeName   as string,
            payload.badgeEmoji  as string,
            payload.description as string
          );
          break;

        case 'weekly_recap':
          await sendWeeklyRecapEmail(to, payload.name as string, {
            weeklyXP:     payload.weeklyXP     as number,
            checkIns:     payload.checkIns     as number,
            streak:       payload.streak       as number,
            badgesEarned: payload.badgesEarned as number,
            packRank:     payload.packRank     as number | null,
          });
          break;

        default:
          logger.warn('Unknown email job type', { type, jobId: job.id });
      }

      logger.info('Email job processed', { jobId: job.id, type, to });
    },
    {
      connection:  redis,
      concurrency: 5, // email sending is rate-limited by SMTP
    }
  );

  worker.on('failed', (job, err) => {
    logger.error('Email job failed', {
      jobId: job?.id,
      error: err.message,
      data:  job?.data,
    });
  });

  worker.on('error', (err) => {
    logger.error('Email worker error', { error: err.message });
  });

  logger.info('Email worker started');
  return worker;
}
