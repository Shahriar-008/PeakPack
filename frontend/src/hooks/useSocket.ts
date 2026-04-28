'use client';

// ══════════════════════════════════════════════════════════════
// PeakPack — useSocket Hook
// ══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserLevel, BadgeDefinition } from '@/types';

// ── Socket.IO is loaded client-side only ─────────────────────

let _socket: any = null;

async function getSocket(): Promise<any> {
  if (_socket?.connected) return _socket;

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;

  const { io } = await import('socket.io-client');

  _socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

// ── Event callback types ──────────────────────────────────────

export interface SocketHandlers {
  onXP?:          (data: { xpAwarded: number; newTotal: number; actionType: string }) => void;
  onLevelUp?:     (data: { newLevel: UserLevel; previousLevel: UserLevel }) => void;
  onBadge?:       (badge: Pick<BadgeDefinition, 'emoji' | 'name' | 'description'> & { badgeKey: string }) => void;
  onNewCheckIn?:  (data: unknown) => void;
  onReaction?:    (data: unknown) => void;
  onComment?:     (data: unknown) => void;
  onPackStreak?:  (data: { packId: string; newStreak: number }) => void;
  onNotification?: (data: { type: string; title: string; message: string }) => void;
}

// ── Hook ──────────────────────────────────────────────────────

export function useSockets(handlers: SocketHandlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let socket: any;
    let mounted = true;

    getSocket().then((s) => {
      if (!s || !mounted) return;
      socket = s;

      const on = (event: string, cb: (...args: any[]) => void) => {
        socket.on(event, cb);
      };

      const off = (event: string, cb: (...args: any[]) => void) => {
        socket.off(event, cb);
      };

      const xpCb          = (d: any) => handlersRef.current.onXP?.(d);
      const levelUpCb     = (d: any) => handlersRef.current.onLevelUp?.(d);
      const badgeCb       = (d: any) => handlersRef.current.onBadge?.(d);
      const checkInCb     = (d: any) => handlersRef.current.onNewCheckIn?.(d);
      const reactionCb    = (d: any) => handlersRef.current.onReaction?.(d);
      const commentCb     = (d: any) => handlersRef.current.onComment?.(d);
      const packStreakCb   = (d: any) => handlersRef.current.onPackStreak?.(d);
      const notifCb       = (d: any) => handlersRef.current.onNotification?.(d);

      on('user:xp',            xpCb);
      on('user:level_up',      levelUpCb);
      on('user:badge',         badgeCb);
      on('checkin:new',        checkInCb);
      on('checkin:reaction',   reactionCb);
      on('checkin:comment',    commentCb);
      on('pack:streak',        packStreakCb);
      on('notification:new',   notifCb);

      return () => {
        off('user:xp',            xpCb);
        off('user:level_up',      levelUpCb);
        off('user:badge',         badgeCb);
        off('checkin:new',        checkInCb);
        off('checkin:reaction',   reactionCb);
        off('checkin:comment',    commentCb);
        off('pack:streak',        packStreakCb);
        off('notification:new',   notifCb);
      };
    });

    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
