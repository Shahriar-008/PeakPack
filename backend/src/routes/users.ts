// ══════════════════════════════════════════════════════════════
// PeakPack — User Routes (Step 10)
// ══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate, validateParams } from '../middleware/validate.middleware';
import { errors } from '../middleware/error.middleware';
import { storageService } from '../services/storage.service';
import { getLevelProgress } from '../lib/constants';
import type { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB for avatars
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Images only'));
    cb(null, true);
  },
});

// ── Schemas ──────────────────────────────────────────────────

const updateMeSchema = z.object({
  name:            z.string().min(1).max(100).optional(),
  bio:             z.string().max(300).optional().nullable(),
  goalType:        z.enum(['weight_loss', 'muscle_gain', 'endurance', 'clean_eating', 'custom']).optional(),
  goalDescription: z.string().max(500).optional().nullable(),
  notifyPrefs:     z.record(z.boolean()).optional(),
  onboardingDone:  z.boolean().optional(),
});

const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

// ── GET /api/users/me ────────────────────────────────────────

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, avatarKey: true, bio: true,
        goalType: true, goalDescription: true, xp: true, level: true,
        streak: true, streakFreezes: true, notifyPrefs: true,
        onboardingDone: true, createdAt: true,
        packMembership: {
          include: {
            pack: {
              select: { id: true, name: true, goalType: true, inviteCode: true, packStreak: true },
            },
          },
        },
        badges: {
          select: { badgeKey: true, earnedAt: true },
          orderBy: { earnedAt: 'desc' },
        },
        _count: {
          select: { checkIns: true },
        },
      },
    });

    if (!user) throw errors.notFound('User not found');

    const levelProgress = getLevelProgress(user.xp);

    res.json({
      data: {
        ...user,
        levelProgress,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── PATCH /api/users/me ──────────────────────────────────────

router.patch(
  '/me',
  validate(updateMeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const data = req.body;

      const updated = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true, email: true, name: true, avatarKey: true, bio: true,
          goalType: true, goalDescription: true, xp: true, level: true,
          streak: true, streakFreezes: true, notifyPrefs: true, onboardingDone: true,
        },
      });

      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/users/me/avatar ────────────────────────────────

router.post(
  '/me/avatar',
  upload.single('avatar'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;

      if (!req.file) throw errors.badRequest('No avatar file provided');

      // Upload to Supabase Storage
      const objectKey = await storageService.uploadAvatar(
        userId,
        req.file.buffer,
        req.file.mimetype
      );

      // Delete old avatar if exists
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarKey: true } });
      if (user?.avatarKey && user.avatarKey !== objectKey) {
        await storageService.deleteAvatar(user.avatarKey).catch(() => {});
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { avatarKey: objectKey },
        select: { id: true, avatarKey: true },
      });

      const avatarUrl = storageService.getAvatarUrl(objectKey);

      res.json({ data: { avatarKey: objectKey, avatarUrl } });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/users/me/xp-history ────────────────────────────

router.get('/me/xp-history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const limit  = Math.min(100, parseInt(req.query.limit as string || '20', 10));
    const page   = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const skip   = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.xPEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.xPEvent.count({ where: { userId } }),
    ]);

    res.json({
      data: events,
      pagination: { page, limit, total, hasMore: skip + events.length < total },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/users/:id ───────────────────────────────────────
// Public profile — only non-sensitive fields

router.get(
  '/:id',
  validateParams(userIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userIdStr = id as string;

      const user = await prisma.user.findUnique({
        where: { id: userIdStr },
        select: {
          id: true, name: true, avatarKey: true, bio: true,
          level: true, xp: true, streak: true,
          goalType: true, goalDescription: true, createdAt: true,
          badges: {
            select: { badgeKey: true, earnedAt: true },
            orderBy: { earnedAt: 'desc' },
          },
          _count: {
            select: { checkIns: true },
          },
          packMembership: {
            select: {
              pack: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!user) throw errors.notFound('User not found');

      res.json({ data: { ...user, levelProgress: getLevelProgress(user.xp) } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
