// ══════════════════════════════════════════════════════════════
// PeakPack — Streak Service
// ══════════════════════════════════════════════════════════════

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import {
  XP_REWARDS,
  STREAK_FREEZE_MAX,
  STREAK_FREEZE_EARN_INTERVAL,
} from '../lib/constants';
import { awardXP } from './xp.service';

// ── Helpers ──────────────────────────────────────────────────

function getYesterday(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ── Increment Streak ─────────────────────────────────────────

/**
 * Called after a successful check-in.
 * 1. Increment user.streak by 1
 * 2. If streak % 7 === 0: award streak bonus XP, earn freeze
 * 3. If streak === 7 and perfect week: award perfect_week XP
 */
export async function increment(userId: string): Promise<number> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { streak: { increment: 1 } },
    select: { streak: true, streakFreezes: true },
  });

  const newStreak = user.streak;

  // 7-day milestones
  if (newStreak > 0 && newStreak % 7 === 0) {
    // Award streak bonus XP
    await awardXP(userId, XP_REWARDS.streak_7_day, 'streak_7_day', {
      streak: newStreak,
    });

    // Earn a streak freeze (if below max)
    if (user.streakFreezes < STREAK_FREEZE_MAX) {
      await prisma.user.update({
        where: { id: userId },
        data: { streakFreezes: { increment: 1 } },
      });
      logger.info('Streak freeze earned', { userId, streak: newStreak });
    }

    logger.info('Streak milestone', { userId, streak: newStreak });
  }

  // Perfect week (exactly 7 days in a row, check if all 7 days had check-ins)
  if (newStreak === 7) {
    // Check if user had 7 consecutive check-in days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const checkInCount = await prisma.checkIn.count({
      where: {
        userId,
        date: { gte: sevenDaysAgo },
      },
    });

    if (checkInCount >= 7) {
      await awardXP(userId, XP_REWARDS.perfect_week, 'perfect_week');
      logger.info('Perfect week achieved', { userId });
    }
  }

  return newStreak;
}

// ── Reset Missed Streaks ─────────────────────────────────────

/**
 * Called by cron at 00:05 daily.
 * Find all users with streak > 0 who didn't check in yesterday.
 * Use freeze if available, otherwise reset streak to 0.
 */
export async function resetMissed(): Promise<{
  frozenCount: number;
  brokenCount: number;
}> {
  const yesterday = getYesterday();

  // Find users with streak > 0
  const activeStreakUsers = await prisma.user.findMany({
    where: { streak: { gt: 0 } },
    select: { id: true, streak: true, streakFreezes: true },
  });

  let frozenCount = 0;
  let brokenCount = 0;

  for (const user of activeStreakUsers) {
    // Check if user has a check-in for yesterday
    const checkedIn = await prisma.checkIn.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: yesterday,
        },
      },
    });

    if (checkedIn) continue; // User checked in, streak is safe

    if (user.streakFreezes > 0) {
      // Use a freeze
      await prisma.user.update({
        where: { id: user.id },
        data: { streakFreezes: { decrement: 1 } },
      });

      frozenCount++;
      logger.debug('Streak freeze used', {
        userId: user.id,
        remainingFreezes: user.streakFreezes - 1,
      });

      // TODO: Queue notification: "Freeze used! Your streak is safe for now."
    } else {
      // Break streak
      await prisma.user.update({
        where: { id: user.id },
        data: { streak: 0 },
      });

      brokenCount++;
      logger.debug('Streak broken', { userId: user.id, wasStreak: user.streak });

      // TODO: Queue notification: "Your streak was broken. Start fresh today!"
    }
  }

  logger.info('Streak reset complete', {
    totalChecked: activeStreakUsers.length,
    frozenCount,
    brokenCount,
  });

  return { frozenCount, brokenCount };
}

// ── Check Pack Streak ────────────────────────────────────────

/**
 * Called by cron at 00:01 daily.
 * For each pack: if all members checked in yesterday, increment pack streak
 * and award bonus XP to all members.
 */
export async function checkPackStreak(): Promise<void> {
  const yesterday = getYesterday();

  const packs = await prisma.pack.findMany({
    include: {
      members: {
        select: { userId: true },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  for (const pack of packs) {
    if (pack._count.members === 0) continue;

    // Count members who checked in yesterday
    const checkedInCount = await prisma.checkIn.count({
      where: {
        userId: { in: pack.members.map((m) => m.userId) },
        date: yesterday,
      },
    });

    if (checkedInCount === pack._count.members) {
      // All members checked in! Increment pack streak
      await prisma.pack.update({
        where: { id: pack.id },
        data: { packStreak: { increment: 1 } },
      });

      // Award bonus XP to all members
      for (const member of pack.members) {
        await awardXP(
          member.userId,
          XP_REWARDS.pack_streak_bonus,
          'pack_streak_bonus',
          { packId: pack.id }
        );
      }

      logger.info('Pack streak incremented', {
        packId: pack.id,
        newStreak: pack.packStreak + 1,
        memberCount: pack._count.members,
      });

      // TODO: Emit 'pack:streak' Socket event
    } else {
      // Not all members checked in — reset pack streak
      if (pack.packStreak > 0) {
        await prisma.pack.update({
          where: { id: pack.id },
          data: { packStreak: 0 },
        });

        logger.debug('Pack streak reset', {
          packId: pack.id,
          wasStreak: pack.packStreak,
          checkedIn: checkedInCount,
          total: pack._count.members,
        });
      }
    }
  }
}

export const streakService = {
  increment,
  resetMissed,
  checkPackStreak,
};

export default streakService;
