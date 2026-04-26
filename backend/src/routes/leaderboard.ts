// ══════════════════════════════════════════════════════════════
// PeakPack — Leaderboard Routes (Step 10)
// ══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { errors } from '../middleware/error.middleware';
import {
  getPackLeaderboard,
  getGlobalLeaderboard,
  getUserRank,
} from '../services/leaderboard.service';
import type { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authMiddleware);

// ── GET /api/leaderboard/global ──────────────────────────────

router.get('/global', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const limit  = Math.min(100, parseInt(req.query.limit as string || '50', 10));

    const [entries, myRank] = await Promise.all([
      getGlobalLeaderboard(limit),
      getUserRank(userId),
    ]);

    res.json({
      data: entries,
      meta: { myRank },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/leaderboard/pack/:packId ────────────────────────

router.get('/pack/:packId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { packId } = req.params;
    const packIdStr = packId as string;

    if (!packIdStr) throw errors.badRequest('packId is required');

    const limit = Math.min(100, parseInt(req.query.limit as string || '50', 10));

    const [entries, myRank] = await Promise.all([
      getPackLeaderboard(packIdStr, limit),
      getUserRank(userId, packIdStr),
    ]);

    res.json({
      data: entries,
      meta: { myRank },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
