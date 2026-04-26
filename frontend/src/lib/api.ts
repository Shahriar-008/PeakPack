// ══════════════════════════════════════════════════════════════
// PeakPack — Axios Instance + Typed API Functions
// ══════════════════════════════════════════════════════════════

import axios from 'axios';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ── Token Management ─────────────────────────────────────────

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('pp_access_token', token);
  } else {
    localStorage.removeItem('pp_access_token');
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('pp_access_token');
  }
  return accessToken;
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem('pp_refresh_token', token);
  } else {
    localStorage.removeItem('pp_refresh_token');
  }
}

export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('pp_refresh_token');
  }
  return null;
}

// ── Request Interceptor ──────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor (auto-refresh) ──────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        // No refresh token — force logout
        setAccessToken(null);
        setRefreshToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/sign-in';
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        setRefreshToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/sign-in';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth API ─────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data).then((r) => r.data.data),

  login: (data: LoginPayload) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data).then((r) => r.data.data),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken }).then((r) => r.data.data),

  logout: () =>
    api.post<ApiResponse<{ success: boolean }>>('/auth/logout').then((r) => r.data.data),

  googleAuth: () => {
    window.location.href = `${API_URL}/auth/google`;
  },
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
