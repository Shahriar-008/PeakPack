// ══════════════════════════════════════════════════════════════
// PeakPack — Rate Limiting Middleware
//
// Applied at Express level so it works in all environments
// (Coolify/Traefik, raw VPS, local dev). Nginx adds an extra
// layer in raw VPS deployments but this is the primary guard.
// ══════════════════════════════════════════════════════════════

import rateLimit from 'express-rate-limit';

// ── General API: 100 requests per minute per IP ───────────────
export const apiLimiter = rateLimit({
  windowMs:         60 * 1000,   // 1 minute
  max:              100,
  standardHeaders:  'draft-7',   // RateLimit-* headers (RFC 9110)
  legacyHeaders:    false,
  message: {
    error: {
      message: 'Too many requests, please slow down.',
      code:    'RATE_LIMITED',
    },
  },
  skip: (req) => req.path === '/api/health' || req.path === '/api/healthz' || req.path === '/api/metrics',
});

// ── Auth endpoints: 10 requests per minute per IP ─────────────
// Prevents brute-force attacks on login/register/refresh
export const authLimiter = rateLimit({
  windowMs:         60 * 1000,   // 1 minute
  max:              10,
  standardHeaders:  'draft-7',
  legacyHeaders:    false,
  message: {
    error: {
      message: 'Too many authentication attempts. Please try again in a minute.',
      code:    'AUTH_RATE_LIMITED',
    },
  },
});

// ── File upload: 20 uploads per hour per IP ───────────────────
// Extra throttle for multipart endpoints (avatar, progress photos)
export const uploadLimiter = rateLimit({
  windowMs:         60 * 60 * 1000, // 1 hour
  max:              20,
  standardHeaders:  'draft-7',
  legacyHeaders:    false,
  message: {
    error: {
      message: 'Upload limit reached. Please try again later.',
      code:    'UPLOAD_RATE_LIMITED',
    },
  },
});
