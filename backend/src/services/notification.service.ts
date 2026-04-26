// ══════════════════════════════════════════════════════════════
// PeakPack — Notification Service (Batch 4 update)
// ══════════════════════════════════════════════════════════════

import { logger } from '../lib/logger';
import { queueNotification } from '../jobs/queue';
import type { NotificationJobType } from '../jobs/queue';

// ── Notification Types ────────────────────────────────────────

export type NotificationType = NotificationJobType;

export interface NotificationPayload {
  userId:  string;
  type:    NotificationType;
  title:   string;
  message: string;
  meta?:   Record<string, unknown>;
}

// ── Create Notification ───────────────────────────────────────

/**
 * Enqueue a notification for async processing by the notification worker.
 * The worker will persist to Redis and emit via Socket.IO.
 */
export async function createNotification(payload: NotificationPayload): Promise<void> {
  try {
    await queueNotification({
      userId:  payload.userId,
      type:    payload.type,
      title:   payload.title,
      message: payload.message,
      meta:    payload.meta,
    });
  } catch (err) {
    // Non-fatal — log and continue. Never let notification failures break the API.
    logger.error('Failed to queue notification', { error: err, payload });
  }
}

// ── Batch Notify ──────────────────────────────────────────────

export async function notifyMany(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await Promise.allSettled(
    userIds.map((userId) =>
      createNotification({ userId, type, title, message, meta })
    )
  );
}

// ── Convenience Factories ─────────────────────────────────────

export async function notifyBadgeUnlocked(
  userId: string,
  badgeName: string,
  badgeEmoji: string
): Promise<void> {
  await createNotification({
    userId,
    type:    'badge_unlocked',
    title:   `${badgeEmoji} Badge Unlocked: ${badgeName}`,
    message: `You just earned the "${badgeName}" badge. Keep it up!`,
    meta:    { badgeName, badgeEmoji },
  });
}

export async function notifyLevelUp(
  userId: string,
  newLevel: string,
  previousLevel: string
): Promise<void> {
  await createNotification({
    userId,
    type:    'level_up',
    title:   `🎉 Level Up! You're now ${newLevel}`,
    message: `You've graduated from ${previousLevel} to ${newLevel}. Incredible progress!`,
    meta:    { newLevel, previousLevel },
  });
}

export async function notifyStreakReminder(userId: string, streak: number): Promise<void> {
  await createNotification({
    userId,
    type:    'streak_reminder',
    title:   `🔥 Keep your ${streak}-day streak alive!`,
    message: "Don't forget to check in today before midnight UTC.",
    meta:    { streak },
  });
}

export async function notifyStreakBroken(userId: string, wasStreak: number): Promise<void> {
  await createNotification({
    userId,
    type:    'streak_broken',
    title:   '💔 Your streak was broken',
    message: `Your ${wasStreak}-day streak ended. Start fresh today — you've got this!`,
    meta:    { wasStreak },
  });
}

export const notificationService = {
  createNotification,
  notifyMany,
  notifyBadgeUnlocked,
  notifyLevelUp,
  notifyStreakReminder,
  notifyStreakBroken,
};

export default notificationService;
