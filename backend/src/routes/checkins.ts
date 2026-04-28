// ══════════════════════════════════════════════════════════════
// PeakPack — Check-In Routes (Step 9)
// ══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate, validateParams } from '../middleware/validate.middleware';
import { errors } from '../middleware/error.middleware';
import { calculateXP, awardXP } from '../services/xp.service';
import { increment as incrementStreak } from '../services/streak.service';
import { checkAndAward } from '../services/badge.service';
import { storageService } from '../services/storage.service';
import type { AuthenticatedRequest } from '../types';

const router = Router();

// All check-in routes require authentication
router.use(authMiddleware);

// ── DOMPurify instance (server-side with jsdom) ─────────────────
// Sanitizes comment content to prevent stored XSS
const { window } = new JSDOM('');
const purify = DOMPurify(window as any);

// ── Multer — memory storage, 5 MB limit, image allowlist ─────────
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per roadmap spec
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
    cb(null, true);
  },
});

// ── Schemas ──────────────────────────────────────────────────

const createCheckInSchema = z.object({
  workoutDone:          z.boolean().default(false),
  workoutType:          z.string().max(100).optional().nullable(),
  workoutDurationMins:  z.number().int().min(0).max(1440).optional().nullable(),
  mealType:             z.enum(['clean', 'cheat', 'skip']).optional().nullable(),
  isRestDay:            z.boolean().default(false),
});

const reactionSchema = z.object({
  type: z.enum(['fire', 'strong', 'letsgo']),
});

const commentSchema = z.object({
  content: z.string().min(1).max(200),
});

const idParamSchema = z.object({
  id: z.string().uuid('Invalid check-in ID'),
});

// ── Helper: today's UTC date (DATE only) ─────────────────────

function todayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ── POST /api/checkins ───────────────────────────────────────

router.post(
  '/',
  validate(createCheckInSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { workoutDone, workoutType, workoutDurationMins, mealType, isRestDay } = req.body;
      const today = todayUTC();

      // Prevent duplicate check-in
      const existing = await prisma.checkIn.findUnique({
        where: { userId_date: { userId, date: today } },
      });
      if (existing) {
        throw errors.conflict('You have already checked in today');
      }

      // Calculate XP
      const xpEarned = calculateXP({ workoutDone, mealType, isRestDay });

      // Create check-in
      const checkIn = await prisma.checkIn.create({
        data: {
          userId,
          date: today,
          workoutDone,
          workoutType: workoutType ?? null,
          workoutDurationMins: workoutDurationMins ?? null,
          mealType: mealType ?? null,
          isRestDay,
          xpEarned,
        },
        include: {
          user: {
            select: { id: true, name: true, avatarKey: true, level: true, streak: true, xp: true },
          },
          reactions: true,
          comments: {
            include: { user: { select: { id: true, name: true, avatarKey: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      // Award XP (non-blocking — errors logged internally)
      let xpResult = null;
      if (xpEarned > 0) {
        xpResult = await awardXP(userId, xpEarned, 'workout_checkin', { checkInId: checkIn.id });
      }

      // Increment streak
      const newStreak = await incrementStreak(userId);

      // Check & award badges
      const newBadges = await checkAndAward(userId);

      logger.info('Check-in created', { userId, checkInId: checkIn.id, xpEarned, newStreak });

      res.status(201).json({
        data: {
          checkIn,
          xpEarned: xpResult?.xpAwarded ?? 0,
          newStreak,
          levelUp: xpResult?.levelUp,
          newBadges,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/checkins/today ──────────────────────────────────

router.get('/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const today = todayUTC();

    const checkIn = await prisma.checkIn.findUnique({
      where: { userId_date: { userId, date: today } },
      include: {
        reactions: true,
        comments: {
          include: { user: { select: { id: true, name: true, avatarKey: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    res.json({ data: checkIn }); // null if not checked in yet
  } catch (error) {
    next(error);
  }
});

// ── GET /api/checkins/me ─────────────────────────────────────

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const page  = Math.max(1, parseInt(req.query.page  as string || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
    const skip  = (page - 1) * limit;

    const [checkIns, total] = await Promise.all([
      prisma.checkIn.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          reactions: { select: { type: true, userId: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.checkIn.count({ where: { userId } }),
    ]);

    res.json({
      data: checkIns,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + checkIns.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/checkins/:id ────────────────────────────────────

router.get(
  '/:id',
  validateParams(idParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const checkInId = id as string;

      const checkIn = await prisma.checkIn.findUnique({
        where: { id: checkInId },
        include: {
          user: { select: { id: true, name: true, avatarKey: true, level: true } },
          reactions: { include: { user: { select: { id: true, name: true } } } },
          comments: {
            include: { user: { select: { id: true, name: true, avatarKey: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!checkIn) throw errors.notFound('Check-in not found');

      res.json({ data: checkIn });
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/checkins/:id/reactions ─────────────────────────

router.post(
  '/:id/reactions',
  validateParams(idParamSchema),
  validate(reactionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id: checkInId } = req.params;
      const checkInIdStr = checkInId as string;
      const { type } = req.body;

      // Verify check-in exists
      const checkIn = await prisma.checkIn.findUnique({ where: { id: checkInIdStr } });
      if (!checkIn) throw errors.notFound('Check-in not found');

      // Prevent self-reaction
      if (checkIn.userId === userId) {
        throw errors.badRequest('Cannot react to your own check-in');
      }

      // Upsert reaction (idempotent per user+checkin+type)
      const reaction = await prisma.reaction.upsert({
        where: {
          userId_checkInId_type: { userId, checkInId: checkInIdStr, type },
        },
        create: { userId, checkInId: checkInIdStr, type },
        update: {}, // already exists — no-op
      });

      // Award encourage XP to reactor (once per check-in regardless of type)
      const alreadyReacted = await prisma.reaction.count({
        where: { userId, checkInId: checkInIdStr },
      });
      if (alreadyReacted === 1) {
        // First reaction to this check-in — award XP
        await awardXP(userId, 10, 'encourage_packmate', { checkInId: checkInIdStr });
      }

      res.status(201).json({ data: reaction });
    } catch (error) {
      next(error);
    }
  }
);

// ── DELETE /api/checkins/:id/reactions ───────────────────────

router.delete(
  '/:id/reactions',
  validateParams(idParamSchema),
  validate(reactionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id: checkInId } = req.params;
      const checkInIdStr = checkInId as string;
      const { type } = req.body;

      await prisma.reaction.deleteMany({
        where: { userId, checkInId: checkInIdStr, type },
      });

      res.json({ data: { success: true } });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/checkins/:id/comments ───────────────────────────

router.get(
  '/:id/comments',
  validateParams(idParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: checkInId } = req.params;
      const checkInIdStr = checkInId as string;

      const checkIn = await prisma.checkIn.findUnique({ where: { id: checkInIdStr } });
      if (!checkIn) throw errors.notFound('Check-in not found');

      const comments = await prisma.comment.findMany({
        where: { checkInId: checkInIdStr },
        include: {
          user: { select: { id: true, name: true, avatarKey: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json({ data: comments });
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/checkins/:id/comments ─────────────────────────

router.post(
  '/:id/comments',
  validateParams(idParamSchema),
  validate(commentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id: checkInId } = req.params;
      const checkInIdStr = checkInId as string;
      const { content } = req.body;

      const checkIn = await prisma.checkIn.findUnique({ where: { id: checkInIdStr } });
      if (!checkIn) throw errors.notFound('Check-in not found');

      // Sanitize comment content (prevent stored XSS)
      const sanitized = purify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      if (!sanitized.trim()) {
        throw errors.badRequest('Comment content is empty after sanitization');
      }

      const comment = await prisma.comment.create({
        data: { userId, checkInId: checkInIdStr, content: sanitized },
        include: {
          user: { select: { id: true, name: true, avatarKey: true } },
        },
      });

      res.status(201).json({ data: comment });
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/checkins/:id/photo ─────────────────────────────

router.post(
  '/:id/photo',
  validateParams(idParamSchema),
  upload.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id: checkInId } = req.params;
      const checkInIdStr = checkInId as string;

      if (!req.file) {
        throw errors.badRequest('No photo file provided');
      }

      // Verify ownership
      const checkIn = await prisma.checkIn.findUnique({ where: { id: checkInIdStr } });
      if (!checkIn) throw errors.notFound('Check-in not found');
      if (checkIn.userId !== userId) throw errors.forbidden();

      // Upload to Supabase Storage
      const objectKey = await storageService.uploadProgressPhoto(
        userId,
        checkInIdStr,
        req.file.buffer,
        req.file.mimetype
      );

      // Update check-in with photo key and award photo XP
      const [updated] = await Promise.all([
        prisma.checkIn.update({
          where: { id: checkInIdStr },
          data: { photoKey: objectKey },
        }),
        // Only award XP once (if no prior photo)
        !checkIn.photoKey
          ? awardXP(userId, 30, 'progress_photo', { checkInId: checkInIdStr })
          : Promise.resolve(null),
      ]);

      // Get public URL for immediate display
      const photoUrl = storageService.getPhotoUrl(objectKey);

      res.json({ data: { photoKey: objectKey, photoUrl } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
