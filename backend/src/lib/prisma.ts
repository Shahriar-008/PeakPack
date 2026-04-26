// ══════════════════════════════════════════════════════════════
// PeakPack — Prisma Client Singleton
// ══════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma =
  global.__prisma ||
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Log slow queries in development
prisma.$on('query' as never, (e: any) => {
  if (e.duration > 200) {
    logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});

export { prisma };
export default prisma;
