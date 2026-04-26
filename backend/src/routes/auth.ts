// ══════════════════════════════════════════════════════════════
// PeakPack — Auth Routes
// ══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { AppError, errors } from '../middleware/error.middleware';
import type { AccessTokenPayload, RefreshTokenPayload } from '../types';

const router = Router();

// ── Constants ────────────────────────────────────────────────

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

// ── Helpers ──────────────────────────────────────────────────

function generateAccessToken(userId: string, email: string): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
    type: 'access',
  };
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(userId: string): { token: string; jti: string } {
  const jti = crypto.randomUUID();
  const payload: RefreshTokenPayload = {
    sub: userId,
    type: 'refresh',
    jti,
  };
  const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { token, jti };
}

async function storeRefreshToken(userId: string, jti: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(jti).digest('hex');
  const redisKey = `refresh:${userId}:${tokenHash}`;
  await redis.set(redisKey, '1', 'EX', REFRESH_TOKEN_TTL);
}

async function revokeRefreshToken(userId: string, jti: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(jti).digest('hex');
  const redisKey = `refresh:${userId}:${tokenHash}`;
  await redis.del(redisKey);
}

async function isRefreshTokenValid(userId: string, jti: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(jti).digest('hex');
  const redisKey = `refresh:${userId}:${tokenHash}`;
  const exists = await redis.exists(redisKey);
  return exists === 1;
}

function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// ── Schemas ──────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ── POST /api/auth/register ──────────────────────────────────

router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      // Check if user exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw errors.conflict('An account with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email);
      const { token: refreshToken, jti } = generateRefreshToken(user.id);
      await storeRefreshToken(user.id, jti);

      logger.info('User registered', { userId: user.id, email });

      res.status(201).json({
        data: {
          user: sanitizeUser(user),
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/auth/login ─────────────────────────────────────

router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          packMembership: {
            include: {
              pack: true
            }
          }
        }
      });

      if (!user) {
        throw errors.unauthorized('Invalid email or password');
      }

      // Check password (OAuth users have no password)
      if (!user.passwordHash) {
        throw errors.unauthorized(
          'This account uses Google sign-in. Please use "Continue with Google".'
        );
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw errors.unauthorized('Invalid email or password');
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email);
      const { token: refreshToken, jti } = generateRefreshToken(user.id);
      await storeRefreshToken(user.id, jti);

      logger.info('User logged in', { userId: user.id });

      res.json({
        data: {
          user: sanitizeUser(user),
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/auth/refresh ───────────────────────────────────

router.post(
  '/refresh',
  validate(refreshSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      let payload: RefreshTokenPayload;
      try {
        payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as RefreshTokenPayload;
      } catch {
        throw errors.unauthorized('Invalid or expired refresh token');
      }

      if (payload.type !== 'refresh') {
        throw errors.unauthorized('Invalid token type');
      }

      // Check if token is still valid in Redis (not revoked)
      const valid = await isRefreshTokenValid(payload.sub, payload.jti);
      if (!valid) {
        throw errors.unauthorized('Refresh token has been revoked');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw errors.unauthorized('User not found');
      }

      // Generate new access token
      const accessToken = generateAccessToken(user.id, user.email);

      res.json({
        data: { accessToken },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/auth/logout ────────────────────────────────────

router.post(
  '/logout',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract the refresh token JTI from the authorization header token
      // In practice, the client should send the refresh token to revoke
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
          const payload = jwt.decode(token) as AccessTokenPayload;
          // Delete all refresh tokens for this user (nuclear logout)
          const keys = await redis.keys(`refresh:${payload.sub}:*`);
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } catch {
          // Ignore decode errors during logout
        }
      }

      logger.info('User logged out', { userId: req.user?.id });

      res.json({
        data: { success: true },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/auth/google ─────────────────────────────────────
// Google OAuth redirect — will be implemented with Passport.js
// For now, returns a placeholder response

router.get('/google', (_req: Request, res: Response) => {
  // TODO: Implement with passport-google-oauth20
  // For MVP, redirect to Google OAuth consent screen
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const APP_URL = process.env.APP_URL || 'http://localhost:3000';
  const REDIRECT_URI = `${process.env.API_URL || 'http://localhost:4000/api'}/auth/google/callback`;

  if (!GOOGLE_CLIENT_ID) {
    res.status(501).json({
      error: {
        message: 'Google OAuth not configured',
        code: 'NOT_IMPLEMENTED',
      },
    });
    return;
  }

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  res.redirect(googleAuthUrl.toString());
});

// ── GET /api/auth/google/callback ────────────────────────────

router.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;
    const APP_URL = process.env.APP_URL || 'http://localhost:3000';
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = `${process.env.API_URL || 'http://localhost:4000/api'}/auth/google/callback`;

    if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw errors.badRequest('OAuth callback missing required parameters');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw errors.unauthorized('Failed to exchange OAuth code');
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoResponse.json();

    if (!googleUser.verified_email) {
      throw errors.unauthorized('Google account email is not verified');
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          avatarKey: null, // Could store Google avatar URL
        },
      });
      logger.info('OAuth user created', { userId: user.id, email: user.email });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const { token: refreshToken, jti } = generateRefreshToken(user.id);
    await storeRefreshToken(user.id, jti);

    // Redirect to frontend with tokens in URL fragment (or use a cookie approach)
    const redirectUrl = new URL(`${APP_URL}/`);
    redirectUrl.searchParams.set('access_token', accessToken);
    redirectUrl.searchParams.set('refresh_token', refreshToken);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    next(error);
  }
});

export default router;
