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

import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter, authLimiter } from './middleware/rate-limit.middleware';
import { initSocket } from './lib/socket';
import { createNotificationWorker } from './jobs/notification.job';
import { createEmailWorker }        from './jobs/email.job';
import { createRecapWorker }        from './jobs/recap.job';
import { closeQueues }              from './jobs/queue';
import { startAllCrons, stopAllCrons } from './crons';
import authRouter          from './routes/auth';
import usersRouter         from './routes/users';
import packsRouter         from './routes/packs';
import checkinsRouter      from './routes/checkins';
import badgesRouter        from './routes/badges';
import leaderboardRouter   from './routes/leaderboard';
import challengesRouter    from './routes/challenges';
import notificationsRouter from './routes/notifications';

// ── Express App ──────────────────────────────────────────────

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
  origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cookies
app.use(cookieParser());

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

// ── Health Check ─────────────────────────────────────────────

app.get('/api/health', async (_req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    // Check Redis
    await redis.ping();

    res.json({
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: 'connected',
          redis: 'connected',
        },
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      error: {
        message: 'Service unhealthy',
        code: 'SERVICE_UNHEALTHY',
      },
    });
  }
});

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

const PORT = parseInt(process.env.PORT || '4000', 10);

server.listen(PORT, () => {
  logger.info(`🚀 PeakPack API running on port ${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`   Health: http://localhost:${PORT}/api/health`);

  // ── BullMQ Workers ──────────────────────────────────
  const notificationWorker = createNotificationWorker();
  const emailWorker        = createEmailWorker();
  const recapWorker        = createRecapWorker();

  // ── Cron Jobs ─────────────────────────────────────────
  startAllCrons();

  // Attach workers to server for graceful shutdown reference
  (server as any).__workers = [notificationWorker, emailWorker, recapWorker];
});

// ── Graceful Shutdown ────────────────────────────────────────

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    // Stop crons first (no new jobs)
    stopAllCrons();

    // Close BullMQ workers
    const workers: any[] = (server as any).__workers ?? [];
    await Promise.allSettled(workers.map((w) => w.close()));
    logger.info('BullMQ workers closed');

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
