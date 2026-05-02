// ══════════════════════════════════════════════════════════════
// PeakPack — Pack Routes (Step 10)
// ══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate, validateParams } from '../middleware/validate.middleware';
import { errors } from '../middleware/error.middleware';
import type { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authMiddleware);

// ── Schemas ──────────────────────────────────────────────────

const createPackSchema = z.object({
  name:        z.string().min(2).max(50),
  description: z.string().max(300).optional(),
  goalType:    z.enum(['weight_loss', 'muscle_gain', 'endurance', 'clean_eating', 'custom']),
});

const updatePackSchema = createPackSchema.partial();

const packIdParam = z.object({ id: z.string().uuid('Invalid pack ID') });

// ── POST /api/packs ──────────────────────────────────────────

router.post(
  '/',
  validate(createPackSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { name, description, goalType } = req.body;

      logger.info('Creating pack', { userId, name });

      // User can only be in one pack
      const existing = await prisma.packMember.findUnique({ where: { userId } });
      if (existing) {
        throw errors.conflict('You are already a member of a pack. Leave your current pack first.');
      }

      // Check if user already admins a pack
      const adminPack = await prisma.pack.findUnique({ where: { adminId: userId } });
      if (adminPack) {
        throw errors.conflict('You already have a pack');
      }

      const inviteCode = nanoid(8).toUpperCase();

      logger.info('Creating pack record', { userId, inviteCode });

      const pack = await prisma.pack.create({
        data: {
          name,
          description: description ?? null,
          goalType,
          inviteCode,
          adminId: userId,
          // Auto-join admin as member
          members: {
            create: { userId, role: 'admin' },
          },
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, avatarKey: true, level: true } },
            },
            // Don't include pack relation to avoid circular reference in serialization
          },
        },
      });

      logger.info('Pack created successfully', { packId: pack.id, adminId: userId, name });

      res.status(201).json({ data: pack });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/packs/me ────────────────────────────────────────

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const membership = await prisma.packMember.findUnique({
      where: { userId },
      include: {
        pack: {
          include: {
            admin: { select: { id: true, name: true, avatarKey: true } },
            members: {
              include: {
                user: {
                  select: {
                    id: true, name: true, avatarKey: true,
                    level: true, streak: true, xp: true,
                  },
                },
              },
              orderBy: { joinedAt: 'asc' },
            },
            _count: { select: { members: true } },
          },
        },
      },
    });

    if (!membership) {
      res.json({ data: null });
      return;
    }

    res.json({ data: membership.pack });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/packs/:id ───────────────────────────────────────

router.get(
  '/:id',
  validateParams(packIdParam),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const packIdStr = id as string;

      const pack = await prisma.pack.findUnique({
        where: { id: packIdStr },
        include: {
          admin: { select: { id: true, name: true, avatarKey: true } },
          members: {
            include: {
              user: {
                select: {
                  id: true, name: true, avatarKey: true,
                  level: true, streak: true, xp: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          _count: { select: { members: true } },
        },
      });

      if (!pack) throw errors.notFound('Pack not found');

      res.json({ data: pack });
    } catch (error) {
      next(error);
    }
  }
);

// ── PATCH /api/packs/:id ─────────────────────────────────────

router.patch(
  '/:id',
  validateParams(packIdParam),
  validate(updatePackSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      const packIdStr = id as string;

      const pack = await prisma.pack.findUnique({ where: { id: packIdStr } });
      if (!pack) throw errors.notFound('Pack not found');
      if (pack.adminId !== userId) throw errors.forbidden('Only the pack admin can update pack details');

      const updated = await prisma.pack.update({
        where: { id: packIdStr },
        data: req.body,
      });

      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// ── DELETE /api/packs/:id ────────────────────────────────────

router.delete(
  '/:id',
  validateParams(packIdParam),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      const packIdStr = id as string;

      const pack = await prisma.pack.findUnique({ where: { id: packIdStr } });
      if (!pack) throw errors.notFound('Pack not found');
      if (pack.adminId !== userId) throw errors.forbidden('Only the pack admin can delete this pack');

      await prisma.pack.delete({ where: { id: packIdStr } });

      logger.info('Pack deleted', { packId: packIdStr, adminId: userId });

      res.json({ data: { success: true } });
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/packs/join ─────────────────────────────────────

router.post('/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { inviteCode } = req.body;

    if (!inviteCode || typeof inviteCode !== 'string') {
      throw errors.badRequest('inviteCode is required');
    }

    // Check if already in a pack
    const existingMembership = await prisma.packMember.findUnique({ where: { userId } });
    if (existingMembership) {
      throw errors.conflict('You are already in a pack. Leave first before joining another.');
    }

    const pack = await prisma.pack.findUnique({ where: { inviteCode } });
    if (!pack) throw errors.notFound('Invalid invite code');

    // Add member
    await prisma.packMember.create({
      data: { packId: pack.id, userId, role: 'member' },
    });

    const updatedPack = await prisma.pack.findUnique({
      where: { id: pack.id },
      include: {
        admin: { select: { id: true, name: true, avatarKey: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatarKey: true, level: true } },
          },
        },
        _count: { select: { members: true } },
      },
    });

    logger.info('User joined pack', { userId, packId: pack.id });

    res.status(201).json({ data: updatedPack });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/packs/:id/leave ────────────────────────────────

router.post(
  '/:id/leave',
  validateParams(packIdParam),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id: packId } = req.params;
      const packIdStr = packId as string;

      const membership = await prisma.packMember.findFirst({
        where: { packId: packIdStr, userId },
      });
      if (!membership) throw errors.notFound('You are not a member of this pack');

      // Admin cannot leave (must delete or transfer)
      const pack = await prisma.pack.findUnique({ where: { id: packIdStr } });
      if (pack?.adminId === userId) {
        throw errors.badRequest(
          'Pack admins cannot leave. Transfer admin role or delete the pack.'
        );
      }

      await prisma.packMember.delete({ where: { id: membership.id } });

      logger.info('User left pack', { userId, packId: packIdStr });

      res.json({ data: { success: true } });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/packs/:id/feed ──────────────────────────────────

router.get(
  '/:id/feed',
  validateParams(packIdParam),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id: packId } = req.params;
      const packIdStr = packId as string;

      // Verify membership
      const membership = await prisma.packMember.findFirst({ where: { packId: packIdStr, userId } });
      if (!membership) throw errors.forbidden('You must be a pack member to view the feed');

      const page   = Math.max(1, parseInt(req.query.page  as string || '1', 10));
      const limit  = Math.min(50, parseInt(req.query.limit as string || '20', 10));
      const skip   = (page - 1) * limit;

      // Get all member IDs
      const members = await prisma.packMember.findMany({
        where: { packId: packIdStr },
        select: { userId: true },
      });
      const memberIds = members.map((m) => m.userId);

      const [checkIns, total] = await Promise.all([
        prisma.checkIn.findMany({
          where: { userId: { in: memberIds } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: { id: true, name: true, avatarKey: true, level: true, streak: true },
            },
            reactions: {
              include: { user: { select: { id: true, name: true } } },
            },
            comments: {
              include: { user: { select: { id: true, name: true, avatarKey: true } } },
              orderBy: { createdAt: 'asc' },
              take: 3, // Preview — full comments via /checkins/:id/comments
            },
            _count: { select: { comments: true } },
          },
        }),
        prisma.checkIn.count({
          where: { userId: { in: memberIds } },
        }),
      ]);

      res.json({
        data: checkIns,
        pagination: { page, limit, total, hasMore: skip + checkIns.length < total },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── DELETE /api/packs/:id/members/:memberId ──────────────────
// Admin kicks a member

router.delete(
  '/:id/members/:memberId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId   = (req as AuthenticatedRequest).user.id;
      const { id: packId, memberId: targetUserId } = req.params;
      const packIdStr    = packId as string;
      const targetUserIdStr = targetUserId as string;

      const pack = await prisma.pack.findUnique({ where: { id: packIdStr } });
      if (!pack) throw errors.notFound('Pack not found');
      if (pack.adminId !== adminId) throw errors.forbidden('Only the pack admin can kick members');
      if (targetUserIdStr === adminId) throw errors.badRequest('Cannot kick yourself');

      const membership = await prisma.packMember.findFirst({
        where: { packId: packIdStr, userId: targetUserIdStr },
      });
      if (!membership) throw errors.notFound('Member not found in this pack');

      await prisma.packMember.delete({ where: { id: membership.id } });

      logger.info('Member kicked from pack', { packId: packIdStr, targetUserId: targetUserIdStr, adminId });

      res.json({ data: { success: true } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
