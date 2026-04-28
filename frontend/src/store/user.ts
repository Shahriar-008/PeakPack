// ══════════════════════════════════════════════════════════════
// PeakPack — User Zustand Store
// ══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserLevel } from '@/types';
import { supabase } from '@/lib/supabase';
import { disconnectSocket } from '@/lib/socket';

interface UserState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  addXP: (xp: number) => void;
  setStreak: (streak: number) => void;
  setLevel: (level: UserLevel) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      addXP: (xp) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, xp: state.user.xp + xp }
            : null,
        })),

      setStreak: (streak) =>
        set((state) => ({
          user: state.user ? { ...state.user, streak } : null,
        })),

      setLevel: (level) =>
        set((state) => ({
          user: state.user ? { ...state.user, level } : null,
        })),

      logout: async () => {
        // Sign out from Supabase
        await supabase.auth.signOut();
        // Disconnect Socket.IO
        disconnectSocket();
        // Clear store
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'pp-user-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
