// ══════════════════════════════════════════════════════════════
// PeakPack — Notification Routes (Step 10)
// ══════════════════════════════════════════════════════════════
// NOTE: The full Notification model will be added to Prisma in
// Batch 4. For now, this returns an empty list placeholder
// so the frontend can wire up the endpoint.
// ══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import type { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authMiddleware);

// ── GET /api/notifications ───────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO (Batch 4): query Notification model from DB
    // const notifications = await prisma.notification.findMany({ where: { userId }, ... });
    res.json({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, hasMore: false },
    });
  } catch (error) {
    next(error);
  }
});

// ── PATCH /api/notifications/:id/read ────────────────────────

router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO (Batch 4): mark notification as read
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

// ── PATCH /api/notifications/read-all ────────────────────────

router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO (Batch 4): mark all notifications as read
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

export default router;
