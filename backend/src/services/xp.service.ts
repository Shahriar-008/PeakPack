// ══════════════════════════════════════════════════════════════
// PeakPack — XP Service
// ══════════════════════════════════════════════════════════════

import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import {
  XP_REWARDS,
  LEVEL_THRESHOLDS,
  LEVEL_ORDER,
  getLevelFromXP,
  type LevelName,
} from '../lib/constants';
import type { XPAwardResult } from '../types';

// ── ISO Week Helper ──────────────────────────────────────────

function getISOWeek(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ── Calculate XP for a Check-in ──────────────────────────────

export interface CheckInData {
  workoutDone: boolean;
  mealType?: string | null;
  isRestDay: boolean;
}

/**
 * Calculate XP earned from a single check-in.
 * +50 if workoutDone, +20 if clean meal, +15 if rest day.
 */
export function calculateXP(checkIn: CheckInData): number {
  let xp = 0;

  if (checkIn.workoutDone) {
    xp += XP_REWARDS.workout_checkin;
  }

  if (checkIn.mealType === 'clean') {
    xp += XP_REWARDS.clean_meal;
  }

  if (checkIn.isRestDay) {
    xp += XP_REWARDS.rest_day;
  }

  return xp;
}

// ── Award XP ─────────────────────────────────────────────────

/**
 * Award XP to a user:
 * 1. Increment user.xp
 * 2. Write XPEvent record
 * 3. Update Redis leaderboards (pack + global)
 * 4. Check for level-up
 */
export async function awardXP(
  userId: string,
  xp: number,
  actionType: string,
  meta?: Record<string, any>
): Promise<XPAwardResult> {
  // 1. Increment user XP and get updated total
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: xp } },
    include: {
      packMembership: true,
    },
  });

  const newTotal = user.xp;

  // 2. Write XPEvent record
  await prisma.xPEvent.create({
    data: {
      userId,
      actionType,
      xp,
      meta: meta || undefined,
    },
  });

  // 3. Update Redis leaderboards
  const isoWeek = getISOWeek();
  const leaderboardTTL = 14 * 24 * 60 * 60; // 14 days

  try {
    // Pack leaderboard
    if (user.packMembership) {
      const packKey = `leaderboard:pack:${user.packMembership.packId}:${isoWeek}`;
      await redis.zincrby(packKey, xp, userId);
      // Set TTL only if key is new (NX doesn't exist for EXPIRE, so use conditional)
      const ttl = await redis.ttl(packKey);
      if (ttl === -1) {
        await redis.expire(packKey, leaderboardTTL);
      }
    }

    // Global leaderboard
    const globalKey = `leaderboard:global:${isoWeek}`;
    await redis.zincrby(globalKey, xp, userId);
    const ttl = await redis.ttl(globalKey);
    if (ttl === -1) {
      await redis.expire(globalKey, leaderboardTTL);
    }
  } catch (err) {
    // Redis failures shouldn't break XP awarding
    logger.error('Failed to update Redis leaderboards', { error: err, userId });
  }

  // 4. Check for level-up
  const levelUp = await checkLevelUp(userId, newTotal);

  logger.debug('XP awarded', {
    userId,
    xp,
    newTotal,
    actionType,
    levelUp: levelUp ? true : false,
  });

  return {
    xpAwarded: xp,
    newTotal,
    levelUp,
  };
}

// ── Level-Up Check ───────────────────────────────────────────

/**
 * Check if the user's total XP qualifies for a new level.
 * If so, update DB and return the level transition.
 */
export async function checkLevelUp(
  userId: string,
  totalXP: number
): Promise<{ newLevel: string; previousLevel: string } | undefined> {
  const newLevel = getLevelFromXP(totalXP);

  // Get current level from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { level: true },
  });

  if (!user) return undefined;

  const currentLevel = user.level as LevelName;

  if (newLevel !== currentLevel) {
    // Level up! Update DB
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });

    logger.info('User leveled up', {
      userId,
      previousLevel: currentLevel,
      newLevel,
      totalXP,
    });

    // Socket.IO event emission will be done by the calling route
    // (we avoid circular dependency with socket module here)

    return {
      newLevel,
      previousLevel: currentLevel,
    };
  }

  return undefined;
}

// ── Get Weekly XP ────────────────────────────────────────────

/**
 * Get a user's XP for the current week from Redis.
 */
export async function getWeeklyXP(userId: string, packId?: string): Promise<number> {
  const isoWeek = getISOWeek();

  try {
    if (packId) {
      const score = await redis.zscore(`leaderboard:pack:${packId}:${isoWeek}`, userId);
      return score ? parseInt(score, 10) : 0;
    }

    const score = await redis.zscore(`leaderboard:global:${isoWeek}`, userId);
    return score ? parseInt(score, 10) : 0;
  } catch {
    return 0;
  }
}

export const xpService = {
  calculateXP,
  awardXP,
  checkLevelUp,
  getWeeklyXP,
  getISOWeek,
};

export default xpService;
