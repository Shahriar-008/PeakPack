// ══════════════════════════════════════════════════════════════
// PeakPack — Express Type Augmentation & Shared Backend Types
// ══════════════════════════════════════════════════════════════

import { Request } from 'express';

// Augment Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

// ── API Response Types ───────────────────────────────────────

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ── Service Return Types ─────────────────────────────────────

export interface XPAwardResult {
  xpAwarded: number;
  newTotal: number;
  levelUp?: {
    newLevel: string;
    previousLevel: string;
  };
}

export interface CheckInResult {
  checkin: any; // Prisma CheckIn type
  xpEarned: number;
  newStreak: number;
  levelUp?: {
    newLevel: string;
    previousLevel: string;
  };
}

// ── Authenticated Request Helper ─────────────────────────────

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}
