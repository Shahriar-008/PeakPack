// ══════════════════════════════════════════════════════════════
// PeakPack — Badge Service
// ══════════════════════════════════════════════════════════════

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

// ── Badge Definitions ────────────────────────────────────────

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  emoji: string;
  category: 'fitness' | 'diet' | 'community' | 'level';
  condition: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Fitness
  { key: 'first_workout',    name: 'First Step',        emoji: '👟', category: 'fitness',   description: 'Complete your first workout',    condition: 'total_workouts >= 1' },
  { key: '7_day_warrior',    name: '7-Day Warrior',     emoji: '🗡️', category: 'fitness',   description: 'Maintain a 7-day streak',        condition: 'streak >= 7' },
  { key: '30_day_beast',     name: '30-Day Beast',      emoji: '🦁', category: 'fitness',   description: 'Maintain a 30-day streak',       condition: 'streak >= 30' },
  { key: '100_workouts',     name: 'Century Club',      emoji: '💯', category: 'fitness',   description: 'Complete 100 workouts',          condition: 'total_workouts >= 100' },
  { key: 'iron_week',        name: 'Iron Week',         emoji: '🏋️', category: 'fitness',   description: '7 workouts in one week',         condition: 'workouts_this_week >= 7' },
  // Diet
  { key: 'clean_week',       name: 'Clean Week',        emoji: '🥗', category: 'diet',      description: '7 consecutive clean meals',       condition: 'clean_meals_streak >= 7' },
  { key: '30_day_clean',     name: '30-Day Clean',      emoji: '🌿', category: 'diet',      description: '30 consecutive clean meals',      condition: 'clean_meals_streak >= 30' },
  { key: 'zero_cheat_month', name: 'Zero Cheat Month',  emoji: '🧘', category: 'diet',      description: 'No cheat meals for a full month', condition: 'zero_cheat_meals_this_month' },
  // Community
  { key: 'pack_igniter',     name: 'Pack Igniter',      emoji: '🔥', category: 'community', description: 'Give 20+ reactions in a week',    condition: 'reactions_given_this_week >= 20' },
  { key: 'mvp_of_week',      name: 'MVP of the Week',   emoji: '👑', category: 'community', description: 'Top XP earner in your pack',      condition: 'top_weekly_xp_in_pack' },
  { key: 'pack_leader',      name: 'Pack Leader',       emoji: '🚀', category: 'community', description: 'Create and lead a pack',          condition: 'is_pack_admin' },
  // Level badges (auto-awarded on level up)
  { key: 'level_rookie',     name: 'Rookie',            emoji: '🌱', category: 'level',     description: 'Reach Rookie level (500 XP)',     condition: 'level === Rookie' },
  { key: 'level_grinder',    name: 'Grinder',           emoji: '⚙️', category: 'level',     description: 'Reach Grinder level (1500 XP)',   condition: 'level === Grinder' },
  { key: 'level_beast',      name: 'Beast',             emoji: '🦁', category: 'level',     description: 'Reach Beast level (3500 XP)',     condition: 'level === Beast' },
  { key: 'level_elite',      name: 'Elite',             emoji: '💎', category: 'level',     description: 'Reach Elite level (7000 XP)',     condition: 'level === Elite' },
  { key: 'level_legend',     name: 'Legend',             emoji: '🌟', category: 'level',     description: 'Reach Legend level (13000 XP)',   condition: 'level === Legend' },
  { key: 'level_peak',       name: 'PEAK',              emoji: '🏔️', category: 'level',     description: 'Reach PEAK level (25000 XP)',    condition: 'level === PEAK' },
] as const;

// ── User Stats Interface ─────────────────────────────────────

interface UserStats {
  streak: number;
  level: string;
  totalWorkouts: number;
  workoutsThisWeek: number;
  cleanMealsStreak: number;
  zeroCheatMealsThisMonth: boolean;
  reactionsGivenThisWeek: number;
  topWeeklyXpInPack: boolean;
  isPackAdmin: boolean;
}

// ── Gather User Stats ────────────────────────────────────────

async function getUserStats(userId: string): Promise<UserStats> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      streak: true,
      level: true,
      packMembership: {
        select: { packId: true, role: true },
      },
    },
  });

  if (!user) throw new Error(`User not found: ${userId}`);

  // Total workouts
  const totalWorkouts = await prisma.checkIn.count({
    where: { userId, workoutDone: true },
  });

  // Workouts this week (last 7 days)
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  weekStart.setUTCHours(0, 0, 0, 0);

  const workoutsThisWeek = await prisma.checkIn.count({
    where: {
      userId,
      workoutDone: true,
      date: { gte: weekStart },
    },
  });

  // Clean meals streak (count consecutive clean meals from today backwards)
  const recentCheckins = await prisma.checkIn.findMany({
    where: { userId, mealType: { not: null } },
    orderBy: { date: 'desc' },
    take: 60,
    select: { mealType: true },
  });

  let cleanMealsStreak = 0;
  for (const ci of recentCheckins) {
    if (ci.mealType === 'clean') {
      cleanMealsStreak++;
    } else {
      break;
    }
  }

  // Zero cheat meals this month
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const cheatMealsCount = await prisma.checkIn.count({
    where: {
      userId,
      mealType: 'cheat',
      date: { gte: monthStart },
    },
  });
  const zeroCheatMealsThisMonth = cheatMealsCount === 0;

  // Reactions given this week
  const reactionsGivenThisWeek = await prisma.reaction.count({
    where: {
      userId,
      createdAt: { gte: weekStart },
    },
  });

  // Top weekly XP in pack (simplified — check Redis or DB)
  let topWeeklyXpInPack = false;
  // This will be properly evaluated via Redis leaderboard in a later batch

  // Is pack admin
  const isPackAdmin = user.packMembership?.role === 'admin';

  return {
    streak: user.streak,
    level: user.level,
    totalWorkouts,
    workoutsThisWeek,
    cleanMealsStreak,
    zeroCheatMealsThisMonth,
    reactionsGivenThisWeek,
    topWeeklyXpInPack,
    isPackAdmin,
  };
}

// ── Evaluate Badge Condition ─────────────────────────────────

function evaluateCondition(condition: string, stats: UserStats): boolean {
  switch (condition) {
    // Fitness
    case 'total_workouts >= 1':
      return stats.totalWorkouts >= 1;
    case 'streak >= 7':
      return stats.streak >= 7;
    case 'streak >= 30':
      return stats.streak >= 30;
    case 'total_workouts >= 100':
      return stats.totalWorkouts >= 100;
    case 'workouts_this_week >= 7':
      return stats.workoutsThisWeek >= 7;

    // Diet
    case 'clean_meals_streak >= 7':
      return stats.cleanMealsStreak >= 7;
    case 'clean_meals_streak >= 30':
      return stats.cleanMealsStreak >= 30;
    case 'zero_cheat_meals_this_month':
      return stats.zeroCheatMealsThisMonth;

    // Community
    case 'reactions_given_this_week >= 20':
      return stats.reactionsGivenThisWeek >= 20;
    case 'top_weekly_xp_in_pack':
      return stats.topWeeklyXpInPack;
    case 'is_pack_admin':
      return stats.isPackAdmin;

    // Level badges
    case 'level === Rookie':
      return stats.level === 'Rookie' || isLevelAbove(stats.level, 'Rookie');
    case 'level === Grinder':
      return stats.level === 'Grinder' || isLevelAbove(stats.level, 'Grinder');
    case 'level === Beast':
      return stats.level === 'Beast' || isLevelAbove(stats.level, 'Beast');
    case 'level === Elite':
      return stats.level === 'Elite' || isLevelAbove(stats.level, 'Elite');
    case 'level === Legend':
      return stats.level === 'Legend' || isLevelAbove(stats.level, 'Legend');
    case 'level === PEAK':
      return stats.level === 'PEAK';

    default:
      logger.warn('Unknown badge condition', { condition });
      return false;
  }
}

const LEVEL_RANKS: Record<string, number> = {
  Draft: 0, Rookie: 1, Grinder: 2, Beast: 3, Elite: 4, Legend: 5, PEAK: 6,
};

function isLevelAbove(currentLevel: string, targetLevel: string): boolean {
  return (LEVEL_RANKS[currentLevel] || 0) > (LEVEL_RANKS[targetLevel] || 0);
}

// ── Award Badge ──────────────────────────────────────────────

/**
 * Award a specific badge to a user.
 * Uses unique constraint (userId, badgeKey) to prevent duplicates.
 */
export async function awardBadge(
  userId: string,
  badgeKey: string
): Promise<boolean> {
  try {
    await prisma.badge.create({
      data: {
        userId,
        badgeKey,
      },
    });

    const definition = BADGE_DEFINITIONS.find((b) => b.key === badgeKey);
    logger.info('Badge awarded', {
      userId,
      badgeKey,
      badgeName: definition?.name,
    });

    // TODO: Emit 'user:badge' Socket event
    // TODO: Push in-app notification

    return true;
  } catch (error: any) {
    // P2002 = unique constraint violation — badge already earned
    if (error.code === 'P2002') {
      return false;
    }
    throw error;
  }
}

// ── Check and Award All Badges ───────────────────────────────

/**
 * Check all badge conditions for a user and award any newly earned badges.
 * Called after check-ins, reactions, level-ups, etc.
 */
export async function checkAndAward(userId: string): Promise<string[]> {
  const stats = await getUserStats(userId);

  // Get already earned badges
  const earnedBadges = await prisma.badge.findMany({
    where: { userId },
    select: { badgeKey: true },
  });
  const earnedKeys = new Set(earnedBadges.map((b) => b.badgeKey));

  const newBadges: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (earnedKeys.has(badge.key)) continue; // Already earned

    const conditionMet = evaluateCondition(badge.condition, stats);
    if (conditionMet) {
      const awarded = await awardBadge(userId, badge.key);
      if (awarded) {
        newBadges.push(badge.key);
      }
    }
  }

  if (newBadges.length > 0) {
    logger.info('New badges awarded', { userId, badges: newBadges });
  }

  return newBadges;
}

// ── Get All Badges with Earned Status ────────────────────────

/**
 * Returns all badge definitions merged with user's earned status.
 */
export async function getAllBadgesForUser(userId: string): Promise<
  Array<BadgeDefinition & { earned: boolean; earnedAt?: Date }>
> {
  const earnedBadges = await prisma.badge.findMany({
    where: { userId },
    select: { badgeKey: true, earnedAt: true },
  });

  const earnedMap = new Map(
    earnedBadges.map((b) => [b.badgeKey, b.earnedAt])
  );

  return BADGE_DEFINITIONS.map((def) => ({
    ...def,
    earned: earnedMap.has(def.key),
    earnedAt: earnedMap.get(def.key) || undefined,
  }));
}

export const badgeService = {
  BADGE_DEFINITIONS,
  awardBadge,
  checkAndAward,
  getAllBadgesForUser,
};

export default badgeService;
