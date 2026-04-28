// ══════════════════════════════════════════════════════════════
// PeakPack — Supabase Auth Middleware
// ══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '../lib/supabase';
import { logger } from '../lib/logger';

/**
 * Middleware that verifies the Supabase Bearer token from the Authorization
 * header and attaches req.user = { id, email }.
 *
 * Usage: router.use(authMiddleware) or router.get('/path', authMiddleware, handler)
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    const user = await getUserFromToken(token);

    if (!user) {
      res.status(401).json({
        error: {
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        },
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error: any) {
    logger.warn('Auth middleware failed', { error: error.message });
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
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = await getUserFromToken(token);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
      };
    }
  } catch {
    // Silently ignore invalid tokens in optional mode
  }

  next();
}
