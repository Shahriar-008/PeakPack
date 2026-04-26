// ══════════════════════════════════════════════════════════════
// PeakPack — Notifications Zustand Store
// ══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearNotifications: () =>
    set({
      notifications: [],
      unreadCount: 0,
    }),
}));
