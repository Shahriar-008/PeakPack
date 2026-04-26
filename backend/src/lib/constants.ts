// ══════════════════════════════════════════════════════════════
// PeakPack — XP, Level, Streak, and Badge Constants
// ══════════════════════════════════════════════════════════════

export const XP_REWARDS = {
  workout_checkin:        50,
  clean_meal:             20,
  rest_day:               15,
  encourage_packmate:     10,   // per reaction given
  streak_7_day:           200,
  perfect_week:           500,
  complete_challenge:     300,
  progress_photo:         30,
  pack_streak_bonus:      25,   // per member when whole pack checks in
} as const;

export const LEVEL_THRESHOLDS = {
  Draft:   0,
  Rookie:  500,
  Grinder: 1500,
  Beast:   3500,
  Elite:   7000,
  Legend:  13000,
  PEAK:    25000,
} as const;

export type LevelName = keyof typeof LEVEL_THRESHOLDS;

export const LEVEL_ORDER: LevelName[] = [
  'Draft', 'Rookie', 'Grinder', 'Beast', 'Elite', 'Legend', 'PEAK'
];

export const STREAK_FREEZE_MAX = 3;
export const STREAK_FREEZE_EARN_INTERVAL = 7; // earn 1 per 7-day streak milestone

/**
 * Given a total XP value, return the corresponding level name.
 */
export function getLevelFromXP(totalXP: number): LevelName {
  let result: LevelName = 'Draft';
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
 * Get the next level after the given level, or null if already at PEAK.
 */
export function getNextLevel(currentLevel: LevelName): LevelName | null {
  const idx = LEVEL_ORDER.indexOf(currentLevel);
  if (idx === -1 || idx === LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[idx + 1];
}

/**
 * Get XP progress towards the next level.
 */
export function getLevelProgress(totalXP: number): {
  currentLevel: LevelName;
  nextLevel: LevelName | null;
  currentThreshold: number;
  nextThreshold: number | null;
  progress: number; // 0..1
} {
  const currentLevel = getLevelFromXP(totalXP);
  const nextLevel = getNextLevel(currentLevel);
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
