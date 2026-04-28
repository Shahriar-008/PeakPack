// ══════════════════════════════════════════════════════════════
// PeakPack — Auth Routes (Supabase)
// ══════════════════════════════════════════════════════════════
//
// Auth is primarily handled client-side by the Supabase JS client.
// These routes coordinate between Supabase Auth and our Prisma User record:
//
//  POST /api/auth/callback  — called after Supabase sign-up/sign-in to
//                             ensure a Prisma User record exists
//  POST /api/auth/logout    — server-side cleanup (future use)
// ══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { AppError, errors } from '../middleware/error.middleware';

const router = Router();

// ── Schemas ──────────────────────────────────────────────────

const callbackSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

// ── POST /api/auth/callback ──────────────────────────────────
// Called by the frontend after Supabase auth (sign-up, sign-in, or OAuth).
// Ensures a matching User record exists in our Prisma database.
// The Supabase access token is sent in the Authorization header.

router.post(
  '/callback',
  authMiddleware,
  validate(callbackSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: supabaseUserId, email } = req.user!;
      const { name } = req.body;

      // Check if user already exists in our DB
      let user = await prisma.user.findUnique({
        where: { id: supabaseUserId },
        include: {
          packMembership: {
            include: {
              pack: true,
            },
          },
        },
      });

      if (user) {
        // User exists — return it
        logger.debug('Auth callback: existing user', { userId: user.id });
        res.json({ data: { user } });
        return;
      }

      // User doesn't exist — create Prisma record with the Supabase user ID
      // Determine name: from request body, or from Supabase user metadata, or fallback
      let displayName = name;

      if (!displayName) {
        // Try to get name from Supabase user metadata (set by OAuth providers)
        const { data: supabaseUser } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
        displayName =
          supabaseUser?.user?.user_metadata?.full_name ||
          supabaseUser?.user?.user_metadata?.name ||
          email?.split('@')[0] ||
          'User';
      }

      user = await prisma.user.create({
        data: {
          id: supabaseUserId,
          email: email!,
          name: displayName,
        },
        include: {
          packMembership: {
            include: {
              pack: true,
            },
          },
        },
      });

      logger.info('Auth callback: new user created', { userId: user.id, email });

      res.status(201).json({ data: { user } });
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/auth/logout ────────────────────────────────────
// Server-side cleanup on logout.
// The actual session invalidation is handled by Supabase client-side.

router.post(
  '/logout',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('User logged out', { userId: req.user?.id });

      res.json({
        data: { success: true },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/auth/me ─────────────────────────────────────────
// Quick endpoint to check if the Supabase token is valid and get user data.

router.get(
  '/me',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: {
          packMembership: {
            include: {
              pack: true,
            },
          },
        },
      });

      if (!user) {
        throw errors.notFound('User not found');
      }

      res.json({ data: { user } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
