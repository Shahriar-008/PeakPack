// ══════════════════════════════════════════════════════════════
// PeakPack — Challenge Routes (Step 10)
// ══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate, validateParams } from '../middleware/validate.middleware';
import { errors } from '../middleware/error.middleware';
import type { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authMiddleware);

// ── Schemas ──────────────────────────────────────────────────

const createChallengeSchema = z.object({
  type:        z.enum(['personal', 'pack', 'community']),
  title:       z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  goalMetric:  z.string().min(1).max(100), // e.g. "workouts:7"
  packId:      z.string().uuid().optional().nullable(),
  startDate:   z.string().datetime(),
  endDate:     z.string().datetime(),
});

const updateProgressSchema = z.object({
  progress: z.number().int().min(0),
});

const challengeIdParam = z.object({ id: z.string().uuid('Invalid challenge ID') });

// ── POST /api/challenges ─────────────────────────────────────

router.post(
  '/',
  validate(createChallengeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { type, title, description, goalMetric, packId, startDate, endDate } = req.body;

      // Validate date range
      if (new Date(startDate) >= new Date(endDate)) {
        throw errors.badRequest('endDate must be after startDate');
      }

      // If pack challenge, validate user is pack admin
      if (type === 'pack' && packId) {
        const pack = await prisma.pack.findUnique({ where: { id: packId } });
        if (!pack) throw errors.notFound('Pack not found');
        if (pack.adminId !== userId) {
          throw errors.forbidden('Only pack admins can create pack challenges');
        }
      }

      const challenge = await prisma.challenge.create({
        data: {
          type,
          title,
          description: description ?? null,
          goalMetric,
          packId: packId ?? null,
          createdById: userId,
          startDate: new Date(startDate),
          endDate:   new Date(endDate),
          // Auto-join creator as participant
          participants: {
            create: { userId, progress: 0 },
          },
        },
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, avatarKey: true } },
            },
          },
        },
      });

      logger.info('Challenge created', { challengeId: challenge.id, createdById: userId });

      res.status(201).json({ data: challenge });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/challenges ──────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const type   = req.query.type as string | undefined; // 'personal' | 'pack' | 'community' | 'mine'
    const page   = Math.max(1, parseInt(req.query.page  as string || '1', 10));
    const limit  = Math.min(50, parseInt(req.query.limit as string || '20', 10));
    const skip   = (page - 1) * limit;
    const now    = new Date();

    let where: any = {};

    if (type === 'mine') {
      where = { participants: { some: { userId } } };
    } else if (type === 'active') {
      where = {
        startDate: { lte: now },
        endDate:   { gte: now },
        participants: { some: { userId } },
      };
    } else if (type) {
      where = { type };
    } else {
      // Default: active + community or participant's
      where = {
        OR: [
          { type: 'community', startDate: { lte: now }, endDate: { gte: now } },
          { participants: { some: { userId } } },
        ],
      };
    }

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { participants: true } },
          participants: {
            where: { userId },
            select: { progress: true, completed: true, joinedAt: true },
          },
        },
      }),
      prisma.challenge.count({ where }),
    ]);

    res.json({
      data: challenges,
      pagination: { page, limit, total, hasMore: skip + challenges.length < total },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/challenges/:id ──────────────────────────────────

router.get(
  '/:id',
  validateParams(challengeIdParam),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const challengeIdStr = id as string;

      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeIdStr },
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, avatarKey: true, level: true } },
            },
            orderBy: { progress: 'desc' },
          },
          _count: { select: { participants: true } },
        },
      });

      if (!challenge) throw errors.notFound('Challenge not found');

      res.json({ data: challenge });
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/challenges/:id/join ────────────────────────────

router.post(
  '/:id/join',
  validateParams(challengeIdParam),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id: challengeId } = req.params;
      const challengeIdStr = challengeId as string;

      const challenge = await prisma.challenge.findUnique({ where: { id: challengeIdStr } });
      if (!challenge) throw errors.notFound('Challenge not found');

      if (new Date() > challenge.endDate) {
        throw errors.badRequest('This challenge has already ended');
      }

      // Idempotent join
      const participant = await prisma.challengeParticipant.upsert({
        where: { challengeId_userId: { challengeId: challengeIdStr, userId } },
        create: { challengeId: challengeIdStr, userId, progress: 0 },
        update: {},
      });

      res.status(201).json({ data: participant });
    } catch (error) {
      next(error);
    }
  }
);

// ── PATCH /api/challenges/:id/progress ───────────────────────

router.patch(
  '/:id/progress',
  validateParams(challengeIdParam),
  validate(updateProgressSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id: challengeId } = req.params;
      const challengeIdStr = challengeId as string;
      const { progress } = req.body;

      const challenge = await prisma.challenge.findUnique({ where: { id: challengeIdStr } });
      if (!challenge) throw errors.notFound('Challenge not found');

      const participant = await prisma.challengeParticipant.findUnique({
        where: { challengeId_userId: { challengeId: challengeIdStr, userId } },
      });
      if (!participant) throw errors.notFound('You are not a participant in this challenge');

      // Parse goal metric (e.g. "workouts:7" → target = 7)
      const [, targetStr] = challenge.goalMetric.split(':');
      const target = targetStr ? parseInt(targetStr, 10) : Infinity;
      const completed = isFinite(target) && progress >= target;

      const updated = await prisma.challengeParticipant.update({
        where: { challengeId_userId: { challengeId: challengeIdStr, userId } },
        data: { progress, completed },
      });

      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// ── DELETE /api/challenges/:id ───────────────────────────────

router.delete(
  '/:id',
  validateParams(challengeIdParam),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      const challengeIdStr = id as string;

      const challenge = await prisma.challenge.findUnique({ where: { id: challengeIdStr } });
      if (!challenge) throw errors.notFound('Challenge not found');
      if (challenge.createdById !== userId) {
        throw errors.forbidden('Only the challenge creator can delete it');
      }

      await prisma.challenge.delete({ where: { id: challengeIdStr } });

      res.json({ data: { success: true } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
