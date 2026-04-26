// ══════════════════════════════════════════════════════════════
// PeakPack — Shared Frontend Types
// ══════════════════════════════════════════════════════════════

// ── Enums ────────────────────────────────────────────────────

export type GoalType = 'weight_loss' | 'muscle_gain' | 'endurance' | 'clean_eating' | 'custom';
export type UserLevel = 'Draft' | 'Rookie' | 'Grinder' | 'Beast' | 'Elite' | 'Legend' | 'PEAK';
export type MealType = 'clean' | 'cheat' | 'skip';
export type PackRole = 'admin' | 'member';
export type ReactionType = 'fire' | 'strong' | 'letsgo';
export type ChallengeType = 'personal' | 'pack' | 'community';

// ── User ─────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarKey: string | null;
  avatarUrl?: string;
  bio: string | null;
  goalType: GoalType;
  goalDescription: string | null;
  xp: number;
  level: UserLevel;
  streak: number;
  streakFreezes: number;
  notifyPrefs: NotifyPrefs;
  onboardingDone: boolean;
  createdAt: string;
  updatedAt: string;
  packMembership?: PackMember | null;
}

export interface PublicUser {
  id: string;
  name: string;
  avatarKey: string | null;
  avatarUrl?: string;
  bio: string | null;
  goalType: GoalType;
  xp: number;
  level: UserLevel;
  streak: number;
}

export interface NotifyPrefs {
  checkin_reminder?: boolean;
  streak_risk?: boolean;
  weekly_recap?: boolean;
}

// ── Pack ─────────────────────────────────────────────────────

export interface Pack {
  id: string;
  name: string;
  description: string | null;
  goalType: GoalType;
  inviteCode: string;
  adminId: string;
  packStreak: number;
  createdAt: string;
  updatedAt: string;
  admin?: PublicUser;
  members?: PackMember[];
  _count?: { members: number };
}

export interface PackMember {
  id: string;
  packId: string;
  userId: string;
  role: PackRole;
  joinedAt: string;
  user?: PublicUser;
  pack?: Pack;
}

// ── Check-in ─────────────────────────────────────────────────

export interface CheckIn {
  id: string;
  userId: string;
  date: string;
  workoutDone: boolean;
  workoutType: string | null;
  workoutDurationMins: number | null;
  mealType: MealType | null;
  isRestDay: boolean;
  xpEarned: number;
  photoKey: string | null;
  photoUrl?: string;
  createdAt: string;
  user?: PublicUser;
  reactions?: Reaction[];
  comments?: Comment[];
  _count?: {
    reactions: number;
    comments: number;
  };
}

export interface CreateCheckInPayload {
  workoutDone: boolean;
  workoutType?: string;
  workoutDurationMins?: number;
  mealType?: MealType;
  isRestDay: boolean;
}

export interface CheckInResponse {
  checkin: CheckIn;
  xpEarned: number;
  newStreak: number;
  levelUp?: {
    newLevel: UserLevel;
    previousLevel: UserLevel;
  };
}

// ── Gamification ─────────────────────────────────────────────

export interface XPEvent {
  id: string;
  userId: string;
  actionType: string;
  xp: number;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface Badge {
  id?: string;
  userId?: string;
  badgeKey: string;
  earnedAt?: string;
}

export interface BadgeDefinition {
  key: string;
  name: string;
  description?: string;
  emoji: string;
  category: 'fitness' | 'diet' | 'community' | 'level';
  condition: string;
  earned: boolean;
  earnedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarKey: string | null;
  level: UserLevel;
  weeklyXP: number;
  weeklyXp: number;  // alias — backend may return either casing
  streak: number;
  user?: PublicUser;  // optional nested form
}

// ── Reactions & Comments ─────────────────────────────────────

export interface Reaction {
  id: string;
  userId: string;
  checkInId: string;
  type: ReactionType;
  createdAt: string;
  user?: PublicUser;
}

export interface Comment {
  id: string;
  userId: string;
  checkInId: string;
  content: string;
  createdAt: string;
  user?: PublicUser;
}

// ── Challenges ───────────────────────────────────────────────

export interface Challenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string | null;
  goalMetric: string;
  packId: string | null;
  createdById: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  participants?: ChallengeParticipant[];
  _count?: { participants: number };
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  progress: number;
  completed: boolean;
  joinedAt: string;
  user?: PublicUser;
}

export interface CreateChallengePayload {
  type: ChallengeType;
  title: string;
  description?: string;
  goalMetric: string;
  packId?: string;
  startDate: string;
  endDate: string;
}

// ── Battles ──────────────────────────────────────────────────

export interface Battle {
  id: string;
  packAId: string;
  packBId: string;
  startDate: string;
  endDate: string;
  winnerId: string | null;
  resolved: boolean;
  createdAt: string;
  packA?: Pack;
  packB?: Pack;
}

// ── Notifications ────────────────────────────────────────────

export interface Notification {
  id: string;
  type: 'checkin_reminder' | 'streak_broken' | 'streak_freeze_used' | 'badge_unlocked' | 'level_up' | 'pack_streak' | 'battle_result' | 'general';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// ── Auth ─────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ── API Response Wrappers ────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    message: string;
    code: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ── Socket.IO Events ────────────────────────────────────────

export interface SocketEvents {
  'pack:checkin': { checkIn: CheckIn; user: PublicUser; xpEarned: number };
  'checkin:reaction': { checkInId: string; reactions: Reaction[] };
  'checkin:comment': { checkInId: string; comment: Comment };
  'user:levelup': { newLevel: UserLevel; previousLevel: UserLevel };
  'user:badge': { badge: BadgeDefinition };
  'user:notification': { type: string; title: string; body: string };
  'pack:streak': { packStreak: number; bonusXP: number };
  'battle:update': { battle: Battle; packAXP: number; packBXP: number };
}
