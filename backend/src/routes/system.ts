import { Router } from 'express';

type ServiceState = 'up' | 'down';

export type DbProbe = { query: () => Promise<unknown> };
export type RedisProbe = { ping: () => Promise<unknown> };

export interface ReadinessResult {
  ready: boolean;
  services: {
    database: ServiceState;
    redis: ServiceState;
  };
}

export async function evaluateReadiness(db: DbProbe, redis: RedisProbe): Promise<ReadinessResult> {
  const services: ReadinessResult['services'] = {
    database: 'up',
    redis: 'up',
  };

  try {
    await db.query();
  } catch {
    services.database = 'down';
  }

  try {
    await redis.ping();
  } catch {
    services.redis = 'down';
  }

  return {
    ready: services.database === 'up' && services.redis === 'up',
    services,
  };
}

export function createSystemRouter(deps: { db: DbProbe; redis: RedisProbe }) {
  const router = Router();

  router.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'alive' });
  });

  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy' });
  });

  router.get('/ready', async (_req, res) => {
    const readiness = await evaluateReadiness(deps.db, deps.redis);
    res.status(readiness.ready ? 200 : 503).json(readiness);
  });

  return router;
}
