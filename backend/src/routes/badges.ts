// ══════════════════════════════════════════════════════════════
// PeakPack — Badge Routes (Step 10)
// ══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getAllBadgesForUser } from '../services/badge.service';
import type { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authMiddleware);

// ── GET /api/badges ──────────────────────────────────────────
// Returns all badge definitions merged with user's earned status

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const badges = await getAllBadgesForUser(userId);
    res.json({ data: badges });
  } catch (error) {
    next(error);
  }
});

export default router;
