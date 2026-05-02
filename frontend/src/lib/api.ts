// ══════════════════════════════════════════════════════════════
// PeakPack — Axios Instance + Typed API Functions
// ══════════════════════════════════════════════════════════════

import axios from 'axios';
import { supabase } from './supabase';
import type {
  User,
  Pack,
  CheckIn,
  CheckInResponse,
  CreateCheckInPayload,
  BadgeDefinition,
  LeaderboardEntry,
  Challenge,
  CreateChallengePayload,
  ChallengeParticipant,
  Notification,
  XPEvent,
  ApiResponse,
  PaginatedResponse,
  Reaction,
  Comment,
  ReactionType,
} from '@/types';

// ── Axios Instance ───────────────────────────────────────────

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const isLocalBrowser =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

if (!publicApiUrl && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_API_URL is required in production.');
}

const API_URL = publicApiUrl || (isLocalBrowser ? 'http://localhost:4000/api' : '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout for all requests
});

// ── Request Interceptor ──────────────────────────────────────
// Attaches the Supabase access token to every API request.

api.interceptors.request.use(async (config) => {
  try {
    // Add a timeout to prevent hanging if Supabase session check is slow
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Session check timeout')), 5000)
    );
    
    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    // If session check fails or times out, continue without token
    // Backend will return 401 if token is required
    console.warn('Failed to get Supabase session:', error);
  }
  return config;
});

// ── Response Interceptor ─────────────────────────────────────
// On 401, attempt a Supabase session refresh and retry once.

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if it's a timeout error
    if (error.code === 'ECONNABORTED' || error.message === 'timeout of 10000ms exceeded') {
      console.error('Request timeout', { url: error.config?.url, timeout: error.config?.timeout });
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Ask Supabase to refresh the session
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !session) {
        // Refresh failed — sign out and redirect
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
          window.location.href = '/sign-in';
        }
        return Promise.reject(error);
      }

      // Retry with new token
      originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

// ── Auth API ─────────────────────────────────────────────────
// Auth is handled client-side by Supabase. These helpers coordinate
// with the backend to ensure Prisma User records exist.

export const authApi = {
  /**
   * Called after Supabase sign-up or sign-in to sync the Prisma User record.
   * The Supabase token is automatically attached by the request interceptor.
   */
  syncUser: (name?: string, accessToken?: string) =>
    api.post<ApiResponse<{ user: User }>>(
      '/auth/callback',
      { name },
      accessToken
        ? {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        : undefined
    ).then((r) => r.data.data.user),

  /**
   * Server-side logout cleanup.
   */
  logout: () =>
    api.post<ApiResponse<{ success: boolean }>>('/auth/logout').then((r) => r.data.data),
};

// ── Users API ────────────────────────────────────────────────

export const usersApi = {
  getMe: () =>
    api.get<ApiResponse<User>>('/users/me').then((r) => r.data.data),

  updateMe: (data: Partial<Pick<User, 'name' | 'bio' | 'goalType' | 'goalDescription' | 'onboardingDone' | 'notifyPrefs'>>) =>
    api.patch<ApiResponse<User>>('/users/me', data).then((r) => r.data.data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ avatarUrl: string }>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },

  getXPHistory: () =>
    api.get<ApiResponse<XPEvent[]>>('/users/me/xp-history').then((r) => r.data.data),

  getUser: (id: string) =>
    api.get<ApiResponse<User>>(`/users/${id}`).then((r) => r.data.data),
};

// ── Packs API ────────────────────────────────────────────────

export const packsApi = {
  create: (data: { name: string; description?: string; goalType: string }) =>
    api.post<ApiResponse<Pack>>('/packs', data).then((r) => r.data.data),

  join: (inviteCode: string) =>
    api.post<ApiResponse<Pack>>('/packs/join', { inviteCode }).then((r) => r.data.data),

  getMine: () =>
    api.get<ApiResponse<Pack>>('/packs/mine').then((r) => r.data.data),

  getFeed: (packId: string, page = 1, limit = 20) =>
    api.get<PaginatedResponse<CheckIn>>(`/packs/${packId}/feed`, {
      params: { page, limit },
    }).then((r) => r.data),

  getMembers: (packId: string) =>
    api.get<ApiResponse<Pack['members']>>(`/packs/${packId}/members`).then((r) => r.data.data),

  removeMember: (packId: string, userId: string) =>
    api.delete(`/packs/${packId}/members/${userId}`).then((r) => r.data),

  update: (packId: string, data: { name?: string; description?: string }) =>
    api.patch<ApiResponse<Pack>>(`/packs/${packId}`, data).then((r) => r.data.data),
};

// ── Check-ins API ────────────────────────────────────────────

export const checkinsApi = {
  create: (data: CreateCheckInPayload) =>
    api.post<ApiResponse<CheckInResponse>>('/checkins', data).then((r) => r.data.data),

  getToday: () =>
    api.get<ApiResponse<CheckIn | null>>('/checkins/today').then((r) => r.data.data),

  getUserCheckins: (userId: string, limit = 30) =>
    api.get<ApiResponse<CheckIn[]>>(`/checkins/user/${userId}`, {
      params: { limit },
    }).then((r) => r.data.data),

  getCommunity: (page = 1, limit = 15) =>
    api.get<PaginatedResponse<CheckIn>>('/checkins/community', {
      params: { page, limit },
    }).then((r) => r.data),

  react: (checkInId: string, type: ReactionType) =>
    api.post<ApiResponse<Reaction[]>>(`/checkins/${checkInId}/react`, { type }).then((r) => r.data.data),

  comment: (checkInId: string, content: string) =>
    api.post<ApiResponse<Comment>>(`/checkins/${checkInId}/comment`, { content }).then((r) => r.data.data),

  uploadPhoto: (checkInId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ photoUrl: string }>>(`/checkins/${checkInId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },
};

// ── Badges API ───────────────────────────────────────────────

export const badgesApi = {
  getAll: () =>
    api.get<ApiResponse<BadgeDefinition[]>>('/badges').then((r) => r.data.data),
};

// ── Leaderboard API ──────────────────────────────────────────

export const leaderboardApi = {
  getPack: (packId: string) =>
    api.get<ApiResponse<LeaderboardEntry[]>>(`/leaderboard/pack/${packId}`).then((r) => r.data.data),

  getGlobal: (limit = 100) =>
    api.get<ApiResponse<LeaderboardEntry[]>>('/leaderboard/global', {
      params: { limit },
    }).then((r) => r.data.data),
};

// ── Challenges API ───────────────────────────────────────────

export const challengesApi = {
  create: (data: CreateChallengePayload) =>
    api.post<ApiResponse<Challenge>>('/challenges', data).then((r) => r.data.data),

  getAll: (params?: { type?: string; packId?: string }) =>
    api.get<ApiResponse<Challenge[]>>('/challenges', { params }).then((r) => r.data.data),

  join: (challengeId: string) =>
    api.post<ApiResponse<Challenge>>(`/challenges/${challengeId}/join`).then((r) => r.data.data),

  updateProgress: (challengeId: string, progress: number) =>
    api.patch<ApiResponse<ChallengeParticipant>>(`/challenges/${challengeId}/progress`, { progress }).then((r) => r.data.data),
};

// ── Notifications API ────────────────────────────────────────

export const notificationsApi = {
  getAll: () =>
    api.get<ApiResponse<Notification[]>>('/notifications').then((r) => r.data.data),

  markAllRead: () =>
    api.patch('/notifications/read-all').then((r) => r.data),
};

export default api;
