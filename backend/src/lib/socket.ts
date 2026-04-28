// ══════════════════════════════════════════════════════════════
// PeakPack — Socket.IO Server (Step 11)
// ══════════════════════════════════════════════════════════════
//
// Architecture:
//  - JWT auth middleware on connection (verifies Bearer token)
//  - Pack rooms: users auto-join room `pack:{packId}` on connect
//  - Event catalogue:
//      Server → Client:
//        checkin:new          — new check-in posted in the pack
//        checkin:reaction     — reaction added/removed
//        checkin:comment      — new comment
//        user:xp              — XP awarded (for the connected user)
//        user:level_up        — level-up animation trigger
//        user:badge           — badge unlocked
//        pack:streak          — pack streak incremented
//        leaderboard:update   — leaderboard changed (debounced)
//      Client → Server:
//        pack:join            — explicit room join (redundant, handled on connect)
//        pack:leave           — leave pack room
// ══════════════════════════════════════════════════════════════

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { prisma } from './prisma';
import { logger } from './logger';
import { getUserFromToken } from './supabase';

// ── Augment Socket with authenticated user ────────────────────

declare module 'socket.io' {
  interface Socket {
    userId: string;
    email:  string;
    packId: string | null;
  }
}

// ── Module-level singleton ────────────────────────────────────

let _io: SocketIOServer | null = null;

// ── Init ──────────────────────────────────────────────────────

/**
 * Initialise Socket.IO and attach it to the HTTP server.
 * Call once from index.ts after creating the http.Server.
 */
export function initSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin:      process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods:     ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout:  20000,
    pingInterval: 25000,
  });

  // ── JWT Authentication Middleware ─────────────────────────

  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const user = await getUserFromToken(token);

      if (!user) {
        return next(new Error('Invalid or expired token'));
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.email  = user.email;

      // Look up pack membership
      const membership = await prisma.packMember.findUnique({
        where: { userId: user.id },
        select: { packId: true },
      });
      socket.packId = membership?.packId ?? null;

      next();
    } catch (err: any) {
      logger.warn('Socket auth failed', { error: err.message });
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection Handler ────────────────────────────────────

  io.on('connection', (socket: Socket) => {
    logger.debug('Socket connected', { socketId: socket.id, userId: socket.userId });

    // Auto-join personal room (for user-specific events)
    socket.join(`user:${socket.userId}`);

    // Auto-join pack room if member
    if (socket.packId) {
      socket.join(`pack:${socket.packId}`);
      logger.debug('Socket joined pack room', { userId: socket.userId, packId: socket.packId });
    }

    // ── Client-driven room management ──────────────────────

    socket.on('pack:join', (packId: string) => {
      if (typeof packId !== 'string') return;
      socket.join(`pack:${packId}`);
    });

    socket.on('pack:leave', (packId: string) => {
      if (typeof packId !== 'string') return;
      socket.leave(`pack:${packId}`);
    });

    // ── Disconnect ──────────────────────────────────────────

    socket.on('disconnect', (reason) => {
      logger.debug('Socket disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        reason,
      });
    });

    // ── Error ───────────────────────────────────────────────

    socket.on('error', (err) => {
      logger.error('Socket error', { socketId: socket.id, userId: socket.userId, error: err.message });
    });
  });

  _io = io;
  logger.info('Socket.IO initialised');
  return io;
}

// ── Singleton accessor ────────────────────────────────────────

export function getIO(): SocketIOServer {
  if (!_io) throw new Error('Socket.IO not initialised. Call initSocket() first.');
  return _io;
}

// ── Emit Helpers ─────────────────────────────────────────────

/**
 * Emit to all sockets in a pack room.
 */
export function emitToPackRoom(packId: string, event: string, data: unknown): void {
  try {
    getIO().to(`pack:${packId}`).emit(event, data);
  } catch (err) {
    logger.warn('Failed to emit to pack room', { packId, event, error: err });
  }
}

/**
 * Emit to a specific user's personal room.
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  try {
    getIO().to(`user:${userId}`).emit(event, data);
  } catch (err) {
    logger.warn('Failed to emit to user room', { userId, event, error: err });
  }
}

/**
 * Notify the user's pack room of a new check-in.
 * Called from the checkins route after check-in creation.
 */
export function emitNewCheckIn(packId: string, checkIn: unknown): void {
  emitToPackRoom(packId, 'checkin:new', checkIn);
}

/**
 * Notify the user's pack room of a reaction event.
 */
export function emitReaction(
  packId: string,
  checkInId: string,
  reaction: unknown,
  action: 'add' | 'remove'
): void {
  emitToPackRoom(packId, 'checkin:reaction', { checkInId, reaction, action });
}

/**
 * Notify the user's pack room of a new comment.
 */
export function emitComment(packId: string, checkInId: string, comment: unknown): void {
  emitToPackRoom(packId, 'checkin:comment', { checkInId, comment });
}

/**
 * Emit XP award to a specific user.
 */
export function emitXP(
  userId: string,
  xpAwarded: number,
  newTotal: number,
  actionType: string
): void {
  emitToUser(userId, 'user:xp', { xpAwarded, newTotal, actionType });
}

/**
 * Emit level-up event to a user.
 */
export function emitLevelUp(userId: string, newLevel: string, previousLevel: string): void {
  emitToUser(userId, 'user:level_up', { newLevel, previousLevel });
}

/**
 * Emit badge unlock event to a user.
 */
export function emitBadgeUnlock(userId: string, badgeKey: string, badgeName: string, emoji: string): void {
  emitToUser(userId, 'user:badge', { badgeKey, badgeName, emoji });
}

/**
 * Emit pack streak update to the whole pack.
 */
export function emitPackStreak(packId: string, newStreak: number): void {
  emitToPackRoom(packId, 'pack:streak', { packId, newStreak });
}

/**
 * Emit leaderboard update to a pack room.
 */
export function emitLeaderboardUpdate(packId: string): void {
  emitToPackRoom(packId, 'leaderboard:update', { packId });
}

export default { initSocket, getIO, emitToPackRoom, emitToUser, emitNewCheckIn, emitReaction, emitComment, emitXP, emitLevelUp, emitBadgeUnlock, emitPackStreak, emitLeaderboardUpdate };
