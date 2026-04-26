// ══════════════════════════════════════════════════════════════
// PeakPack — JWT Auth Middleware
// ══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../lib/logger';
import type { AccessTokenPayload } from '../types';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';

/**
 * Middleware that verifies the Bearer JWT from the Authorization header
 * and attaches req.user = { id, email }.
 *
 * Usage: router.use(authMiddleware) or router.get('/path', authMiddleware, handler)
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        message: 'Authentication required. Provide a Bearer token.',
        code: 'UNAUTHORIZED',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;

    if (payload.type !== 'access') {
      res.status(401).json({
        error: {
          message: 'Invalid token type',
          code: 'INVALID_TOKEN',
        },
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: payload.sub,
      email: payload.email,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: {
          message: 'Token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED',
        },
      });
      return;
    }

    logger.warn('JWT verification failed', { error: error.message });
    res.status(401).json({
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      },
    });
  }
}

/**
 * Optional auth middleware — attaches user if token valid, continues either way.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (payload.type === 'access') {
      req.user = {
        id: payload.sub,
        email: payload.email,
      };
    }
  } catch {
    // Silently ignore invalid tokens in optional mode
  }

  next();
}
