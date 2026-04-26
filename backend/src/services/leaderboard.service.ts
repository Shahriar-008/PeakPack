// ══════════════════════════════════════════════════════════════
// PeakPack — Leaderboard Service (Step 10)
// ══════════════════════════════════════════════════════════════

import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

// ── ISO Week Helper ──────────────────────────────────────────

export function getISOWeek(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ── Types ────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank:     number;
  userId:   string;
  name:     string;
  avatarKey: string | null;
  level:    string;
  weeklyXP: number;
}

// ── Get Pack Leaderboard ─────────────────────────────────────

/**
 * Returns top N members of a pack sorted by weekly XP (Redis sorted set).
 * Falls back to DB query if Redis is unavailable.
 */
export async function getPackLeaderboard(
  packId: string,
  limit = 50
): Promise<LeaderboardEntry[]> {
  const isoWeek = getISOWeek();
  const key = `leaderboard:pack:${packId}:${isoWeek}`;

  try {
    // Get top N with scores, highest first
    const entries = await redis.zrevrangebyscore(key, '+inf', '-inf', 'WITHSCORES', 'LIMIT', 0, limit);

    if (entries.length === 0) {
      return getPackLeaderboardFromDB(packId, limit);
    }

    // Entries come as [userId, score, userId, score, ...]
    const userIds: string[] = [];
    const scoreMap = new Map<string, number>();

    for (let i = 0; i < entries.length; i += 2) {
      const uid = entries[i];
      const score = parseFloat(entries[i + 1]);
      userIds.push(uid);
      scoreMap.set(uid, score);
    }

    // Fetch user details
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarKey: true, level: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return userIds
      .filter((uid) => userMap.has(uid))
      .map((uid, idx) => ({
        rank:     idx + 1,
        userId:   uid,
        name:     userMap.get(uid)!.name,
        avatarKey: userMap.get(uid)!.avatarKey,
        level:    userMap.get(uid)!.level,
        weeklyXP: scoreMap.get(uid) ?? 0,
      }));
  } catch (err) {
    logger.warn('Redis leaderboard unavailable, falling back to DB', { error: err, packId });
    return getPackLeaderboardFromDB(packId, limit);
  }
}

// ── DB Fallback: Pack Leaderboard ───────────────────────────

async function getPackLeaderboardFromDB(packId: string, limit: number): Promise<LeaderboardEntry[]> {
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  weekStart.setUTCHours(0, 0, 0, 0);

  const members = await prisma.packMember.findMany({
    where: { packId },
    include: {
      user: {
        select: {
          id: true, name: true, avatarKey: true, level: true,
          xpEvents: {
            where: { createdAt: { gte: weekStart } },
            select: { xp: true },
          },
        },
      },
    },
  });

  return members
    .map((m) => ({
      userId:   m.user.id,
      name:     m.user.name,
      avatarKey: m.user.avatarKey,
      level:    m.user.level,
      weeklyXP: m.user.xpEvents.reduce((sum, e) => sum + e.xp, 0),
    }))
    .sort((a, b) => b.weeklyXP - a.weeklyXP)
    .slice(0, limit)
    .map((entry, idx) => ({ rank: idx + 1, ...entry }));
}

// ── Get Global Leaderboard ───────────────────────────────────

export async function getGlobalLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const isoWeek = getISOWeek();
  const key = `leaderboard:global:${isoWeek}`;

  try {
    const entries = await redis.zrevrangebyscore(key, '+inf', '-inf', 'WITHSCORES', 'LIMIT', 0, limit);

    if (entries.length === 0) {
      return getGlobalLeaderboardFromDB(limit);
    }

    const userIds: string[] = [];
    const scoreMap = new Map<string, number>();

    for (let i = 0; i < entries.length; i += 2) {
      const uid = entries[i];
      const score = parseFloat(entries[i + 1]);
      userIds.push(uid);
      scoreMap.set(uid, score);
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarKey: true, level: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return userIds
      .filter((uid) => userMap.has(uid))
      .map((uid, idx) => ({
        rank:     idx + 1,
        userId:   uid,
        name:     userMap.get(uid)!.name,
        avatarKey: userMap.get(uid)!.avatarKey,
        level:    userMap.get(uid)!.level,
        weeklyXP: scoreMap.get(uid) ?? 0,
      }));
  } catch (err) {
    logger.warn('Redis global leaderboard unavailable, falling back to DB', { error: err });
    return getGlobalLeaderboardFromDB(limit);
  }
}

async function getGlobalLeaderboardFromDB(limit: number): Promise<LeaderboardEntry[]> {
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  weekStart.setUTCHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    take: limit * 3, // over-fetch then sort
    orderBy: { xp: 'desc' },
    select: {
      id: true, name: true, avatarKey: true, level: true,
      xpEvents: {
        where: { createdAt: { gte: weekStart } },
        select: { xp: true },
      },
    },
  });

  return users
    .map((u) => ({
      userId:   u.id,
      name:     u.name,
      avatarKey: u.avatarKey,
      level:    u.level,
      weeklyXP: u.xpEvents.reduce((sum, e) => sum + e.xp, 0),
    }))
    .sort((a, b) => b.weeklyXP - a.weeklyXP)
    .slice(0, limit)
    .map((entry, idx) => ({ rank: idx + 1, ...entry }));
}

/**
 * Get a user's rank in a pack or global leaderboard.
 */
export async function getUserRank(
  userId: string,
  packId?: string
): Promise<{ rank: number | null; weeklyXP: number }> {
  const isoWeek = getISOWeek();
  const key = packId
    ? `leaderboard:pack:${packId}:${isoWeek}`
    : `leaderboard:global:${isoWeek}`;

  try {
    const [rank, score] = await Promise.all([
      redis.zrevrank(key, userId),
      redis.zscore(key, userId),
    ]);

    return {
      rank:     rank !== null ? rank + 1 : null,
      weeklyXP: score ? parseInt(score, 10) : 0,
    };
  } catch {
    return { rank: null, weeklyXP: 0 };
  }
}

export const leaderboardService = {
  getPackLeaderboard,
  getGlobalLeaderboard,
  getUserRank,
  getISOWeek,
};

export default leaderboardService;
