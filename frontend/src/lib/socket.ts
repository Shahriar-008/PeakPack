// ══════════════════════════════════════════════════════════════
// PeakPack — Socket.IO Client Singleton
// ══════════════════════════════════════════════════════════════

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

/**
 * Get or create the Socket.IO client connection.
 * Connects with JWT auth token from local storage.
 */
export function getSocket(): Socket {
  if (socket && socket.connected) return socket;

  const token = getAccessToken();

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  return socket;
}

/**
 * Disconnect the Socket.IO client.
 * Called on logout.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Reconnect with a new token (after refresh).
 */
export function reconnectSocket(): void {
  disconnectSocket();
  getSocket();
}

export { socket };
