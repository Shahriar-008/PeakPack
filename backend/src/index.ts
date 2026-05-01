// ══════════════════════════════════════════════════════════════
// PeakPack — Express App Entry Point
// ══════════════════════════════════════════════════════════════

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import http from 'http';
import { collectDefaultMetrics, register } from 'prom-client';

import { parseEnv } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter, authLimiter } from './middleware/rate-limit.middleware';
import { requestContext } from './middleware/request-context.middleware';
import { initSocket } from './lib/socket';
import { closeQueues }              from './jobs/queue';
import { startAllCrons, stopAllCrons } from './crons';
import { createSystemRouter } from './routes/system';
import authRouter          from './routes/auth';
import usersRouter         from './routes/users';
import packsRouter         from './routes/packs';
import checkinsRouter      from './routes/checkins';
import badgesRouter        from './routes/badges';
import leaderboardRouter   from './routes/leaderboard';
import challengesRouter    from './routes/challenges';
import notificationsRouter from './routes/notifications';

// ── Express App ──────────────────────────────────────────────

const env = parseEnv(process.env);
const app    = express();
const server = http.createServer(app);

// ── Prometheus default metrics (CPU, memory, event loop, etc.) ─
collectDefaultMetrics({ prefix: 'peakpack_' });

// ── Socket.IO ────────────────────────────────────────────
// Attach to the http.Server BEFORE any request arrives
const io = initSocket(server);

// ── Global Middleware ────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS — restrict to frontend origin
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cookies
app.use(cookieParser());

// Request context
app.use(requestContext);

// HTTP request logging
app.use(morgan('short', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// ── Prometheus Metrics ───────────────────────────────────────
// Scraped by Prometheus every 15s (see monitoring/prometheus.yml)

app.get('/api/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end();
  }
});

app.use(
  '/api',
  createSystemRouter({
    db: { query: () => prisma.$queryRaw`SELECT 1` },
    redis: { ping: () => redis.ping() },
  }),
);

// ── API Routes ───────────────────────────────────────────────
// Auth gets a stricter rate limit (10 req/min — brute-force guard)
// All other API routes: 100 req/min

app.use('/api/auth',          authLimiter, authRouter);
app.use('/api/users',         apiLimiter,  usersRouter);
app.use('/api/packs',         apiLimiter,  packsRouter);
app.use('/api/checkins',      apiLimiter,  checkinsRouter);
app.use('/api/badges',        apiLimiter,  badgesRouter);
app.use('/api/leaderboard',   apiLimiter,  leaderboardRouter);
app.use('/api/challenges',    apiLimiter,  challengesRouter);
app.use('/api/notifications', apiLimiter,  notificationsRouter);

// ── 404 Handler ──────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
});

// ── Global Error Handler ─────────────────────────────────────
// Delegated to error.middleware.ts (AppError aware, Prisma-aware)

app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────

const PORT = env.PORT;
const DATABASE_URL = env.DATABASE_URL;

function validateCriticalConfig(): void {
  if (env.NODE_ENV !== 'production') return;

  if (!DATABASE_URL) {
    logger.error('Startup config error: DATABASE_URL is missing');
    process.exit(1);
  }

  let parsed: URL;
  try {
    parsed = new URL(DATABASE_URL);
  } catch {
    logger.error('Startup config error: DATABASE_URL is not a valid URL');
    process.exit(1);
    return;
  }

  const host = parsed.hostname.toLowerCase();
  const port = parsed.port;
  const sslmode = (parsed.searchParams.get('sslmode') || '').toLowerCase();
  const isSupabaseDirectHost = host.startsWith('db.') && host.endsWith('.supabase.co');

  if (isSupabaseDirectHost && port === '5432') {
    logger.error(
      'Startup config error: Supabase direct DB host (:5432) detected. Use Supabase pooler host (:6543).',
      { host, port }
    );
    process.exit(1);
  }

  if (sslmode !== 'require') {
    logger.error(
      'Startup config error: DATABASE_URL should include sslmode=require in production.',
      { host, port, sslmode: sslmode || '(missing)' }
    );
    process.exit(1);
  }
}

validateCriticalConfig();

server.listen(PORT, () => {
  logger.info(`🚀 PeakPack API running on port ${PORT}`);
  logger.info(`   Environment: ${env.NODE_ENV}`);
  logger.info(`   Health: http://localhost:${PORT}/api/health`);

  // ── Cron Jobs ─────────────────────────────────────────
  startAllCrons();
});

// ── Graceful Shutdown ────────────────────────────────────────

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    // Stop crons first (no new jobs)
    stopAllCrons();

    // Close queues
    await closeQueues();

    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected');
    } catch (e) {
      logger.error('Error disconnecting Prisma', { error: e });
    }

    try {
      redis.disconnect();
      logger.info('Redis disconnected');
    } catch (e) {
      logger.error('Error disconnecting Redis', { error: e });
    }

    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise: String(promise) });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

export { app, server };

