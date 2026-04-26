// ══════════════════════════════════════════════════════════════
// PeakPack — BullMQ Queue Instances (Step 12)
// ══════════════════════════════════════════════════════════════

import { Queue, QueueOptions } from 'bullmq';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

// ── Shared BullMQ connection (uses ioredis) ───────────────────

const connection = redis;

const defaultQueueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts:    3,
    backoff: {
      type:  'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },   // keep last 100 completed
    removeOnFail:     { count: 200 },   // keep last 200 failed for inspection
  },
};

// ── Queue Instances ───────────────────────────────────────────

/** In-app notification queue: badge unlocks, reactions, comments, etc. */
export const notificationQueue = new Queue('notifications', defaultQueueOptions);

/** Transactional email queue: welcome, streak reminder, weekly recap, etc. */
export const emailQueue = new Queue('emails', defaultQueueOptions);

/** Scheduled recap queue: weekly recap computation + email dispatch. */
export const recapQueue = new Queue('recaps', defaultQueueOptions);

// ── Job Type Definitions ──────────────────────────────────────

/** Notification job types */
export type NotificationJobType =
  | 'badge_unlocked'
  | 'level_up'
  | 'pack_streak'
  | 'streak_reminder'
  | 'streak_broken'
  | 'freeze_used'
  | 'reaction_received'
  | 'comment_received'
  | 'challenge_completed'
  | 'new_pack_member';

export interface NotificationJobData {
  userId:  string;
  type:    NotificationJobType;
  title:   string;
  message: string;
  meta?:   Record<string, unknown>;
}

/** Email job types */
export type EmailJobType =
  | 'welcome'
  | 'streak_reminder'
  | 'streak_broken'
  | 'weekly_recap'
  | 'badge_unlocked';

export interface EmailJobData {
  to:      string;
  type:    EmailJobType;
  payload: Record<string, unknown>;
}

/** Recap job data */
export interface RecapJobData {
  userId:    string;
  weekStart: string;   // ISO date string
  weekEnd:   string;
}

// ── Queue Helpers ─────────────────────────────────────────────

/**
 * Add a notification job to the queue.
 */
export async function queueNotification(data: NotificationJobData): Promise<void> {
  try {
    await notificationQueue.add(data.type, data, {
      priority: data.type === 'badge_unlocked' || data.type === 'level_up' ? 1 : 5,
    });
  } catch (err) {
    logger.error('Failed to queue notification', { error: err, data });
  }
}

/**
 * Add an email job to the queue.
 */
export async function queueEmail(data: EmailJobData): Promise<void> {
  try {
    await emailQueue.add(data.type, data, {
      delay: 1000, // slight delay to allow DB writes to settle
    });
  } catch (err) {
    logger.error('Failed to queue email', { error: err, data });
  }
}

/**
 * Add a weekly recap job for a specific user.
 */
export async function queueRecap(data: RecapJobData): Promise<void> {
  try {
    await recapQueue.add('weekly_recap', data);
  } catch (err) {
    logger.error('Failed to queue recap', { error: err, data });
  }
}

// ── Graceful Shutdown ─────────────────────────────────────────

export async function closeQueues(): Promise<void> {
  await Promise.allSettled([
    notificationQueue.close(),
    emailQueue.close(),
    recapQueue.close(),
  ]);
  logger.info('BullMQ queues closed');
}
