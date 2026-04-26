// ══════════════════════════════════════════════════════════════
// PeakPack — Battle Resolver Cron (Step 13)
// Runs every hour
// ══════════════════════════════════════════════════════════════

import cron from 'node-cron';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

/**
 * Hourly — find all active battles whose endDate has passed (and not yet resolved).
 * Compare weekly XP totals for both packs and mark the winner.
 */
export function startBattleResolverCron(): cron.ScheduledTask {
  const task = cron.schedule('0 * * * *', async () => {
    const start = Date.now();

    try {
      const now = new Date();

      // Find unresolved battles that have ended
      const expiredBattles = await prisma.battle.findMany({
        where: {
          resolved: false,
          endDate:  { lte: now },
        },
        include: {
          packA: { include: { members: { select: { userId: true } } } },
          packB: { include: { members: { select: { userId: true } } } },
        },
      });

      if (expiredBattles.length === 0) return;

      logger.info('[CRON] battle-resolver: processing', {
        count: expiredBattles.length,
      });

      for (const battle of expiredBattles) {
        try {
          // Calculate total XP for each pack by summing member XP events
          // during the battle window
          const [packAXP, packBXP] = await Promise.all([
            sumPackXP(battle.packA.members.map((m) => m.userId), battle.startDate, battle.endDate),
            sumPackXP(battle.packB.members.map((m) => m.userId), battle.startDate, battle.endDate),
          ]);

          const winnerId = packAXP >= packBXP ? battle.packAId : battle.packBId;

          await prisma.battle.update({
            where: { id: battle.id },
            data: {
              resolved: true,
              winnerId,
            },
          });

          logger.info('[CRON] battle-resolver: battle resolved', {
            battleId:   battle.id,
            packAId:    battle.packAId,
            packBId:    battle.packBId,
            packAXP,
            packBXP,
            winnerId,
          });
        } catch (err) {
          logger.error('[CRON] battle-resolver: failed to resolve battle', {
            battleId: battle.id,
            error: err,
          });
        }
      }

      logger.info('[CRON] battle-resolver: complete', {
        durationMs: Date.now() - start,
        resolved:   expiredBattles.length,
      });
    } catch (err) {
      logger.error('[CRON] battle-resolver: failed', { error: err });
    }
  });

  logger.info('[CRON] battle-resolver scheduled: hourly');
  return task;
}

// ── Helper ────────────────────────────────────────────────────

async function sumPackXP(
  userIds:   string[],
  startDate: Date,
  endDate:   Date
): Promise<number> {
  if (userIds.length === 0) return 0;

  const events = await prisma.xPEvent.findMany({
    where: {
      userId:    { in: userIds },
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { xp: true },
  });

  return events.reduce((sum, e) => sum + e.xp, 0);
}
