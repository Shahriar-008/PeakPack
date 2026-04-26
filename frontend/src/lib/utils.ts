// ══════════════════════════════════════════════════════════════
// PeakPack — Frontend Utility Functions
// ══════════════════════════════════════════════════════════════

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UserLevel } from '@/types';

/**
 * Merges class names with Tailwind conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Level thresholds — mirrors backend constants
 */
export const LEVEL_THRESHOLDS: Record<UserLevel, number> = {
  Draft: 0,
  Rookie: 500,
  Grinder: 1500,
  Beast: 3500,
  Elite: 7000,
  Legend: 13000,
  PEAK: 25000,
};

const LEVEL_ORDER: UserLevel[] = [
  'Draft', 'Rookie', 'Grinder', 'Beast', 'Elite', 'Legend', 'PEAK',
];

/**
 * Get the level name from total XP
 */
export function getLevelFromXP(totalXP: number): UserLevel {
  let result: UserLevel = 'Draft';
  for (const level of LEVEL_ORDER) {
    if (totalXP >= LEVEL_THRESHOLDS[level]) {
      result = level;
    } else {
      break;
    }
  }
  return result;
}

/**
 * Get XP progress toward next level (0..1)
 */
export function getLevelProgress(totalXP: number): {
  currentLevel: UserLevel;
  nextLevel: UserLevel | null;
  currentThreshold: number;
  nextThreshold: number | null;
  progress: number;
} {
  const currentLevel = getLevelFromXP(totalXP);
  const idx = LEVEL_ORDER.indexOf(currentLevel);
  const nextLevel = idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null;
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel];
  const nextThreshold = nextLevel ? LEVEL_THRESHOLDS[nextLevel] : null;

  const progress = nextThreshold
    ? (totalXP - currentThreshold) / (nextThreshold - currentThreshold)
    : 1;

  return {
    currentLevel,
    nextLevel,
    currentThreshold,
    nextThreshold,
    progress: Math.min(Math.max(progress, 0), 1),
  };
}

/**
 * Format streak for display
 */
export function formatStreak(streak: number): string {
  if (streak === 0) return '0';
  if (streak >= 365) return `${Math.floor(streak / 365)}y ${streak % 365}d`;
  return `${streak}`;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format a date as "time ago" (e.g. "2h ago", "3d ago")
 */
export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Level emoji mapping
 */
export const LEVEL_EMOJIS: Record<UserLevel, string> = {
  Draft: '📝',
  Rookie: '🌱',
  Grinder: '⚙️',
  Beast: '🦁',
  Elite: '💎',
  Legend: '🌟',
  PEAK: '🏔️',
};

/**
 * Level color mapping (Tailwind-compatible)
 */
export const LEVEL_COLORS: Record<UserLevel, string> = {
  Draft: 'text-gray-400',
  Rookie: 'text-green-400',
  Grinder: 'text-blue-400',
  Beast: 'text-orange-400',
  Elite: 'text-purple-400',
  Legend: 'text-yellow-400',
  PEAK: 'text-red-400',
};
