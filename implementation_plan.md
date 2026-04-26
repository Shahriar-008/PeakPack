# PeakPack — Full-Stack Implementation Plan

A community-driven fitness & nutrition accountability web app. Users set goals, join Packs, submit daily check-ins, earn XP/badges/streaks, and compete on leaderboards.

## User Review Required

> [!IMPORTANT]
> This is a **very large application** (~100+ files, full-stack). Building everything in one conversation will be extremely long. I recommend we build it in **batches** following the roadmap's 27-step build order.

> [!WARNING]
> The roadmap specifies exact technology versions (Next.js 14, Tailwind 3, Express 4, Prisma 5, etc.). I'll follow these exactly as written.

### Proposed Execution Batches

| Batch | Steps | Description |
|-------|-------|-------------|
| **Batch 1** | Steps 1–4 | Project scaffolding, types, Prisma schema, Express setup with Prisma/Redis/Logger |
| **Batch 2** | Steps 5–8 | Auth system, XP/Streak/Badge services (gamification engine) |
| **Batch 3** | Steps 9–10 | Check-in routes (core loop), remaining API routes |
| **Batch 4** | Steps 11–13 | Socket.IO real-time, BullMQ queues/worker, cron jobs |
| **Batch 5** | Steps 14–17 | Next.js setup, UI primitives, gamification components, CheckInModal |
| **Batch 6** | Steps 18–19 | Pack feed with Socket.IO, remaining pages (dashboard, leaderboard, challenges, profile) |
| **Batch 7** | Steps 20–23 | Dockerfiles, docker-compose, nginx, local smoke test |
| **Batch 8** | Steps 24–27 | Deployment, security, load test, monitoring |

---

## Proposed Changes

### Batch 1: Foundation (Steps 1–4)

---

#### [NEW] Project Scaffolding (Step 1)
- Create the exact folder structure from Section 3 of the roadmap
- Initialize `package.json` for both `frontend/` and `backend/`
- Set up TypeScript configs for both

#### [NEW] `frontend/src/types/index.ts` (Step 2)  
- All shared TypeScript types/interfaces matching the Prisma schema
- Types for API responses, Socket events, gamification constants

#### [NEW] `backend/prisma/schema.prisma` (Step 3)
- Complete Prisma schema with all 12 models, 7 enums, all relations and indexes
- Run initial migration

#### [NEW] Backend Core Setup (Step 4)
- `backend/src/index.ts` — Express app with middleware stack (helmet, cors, json, error handler)
- `backend/src/lib/prisma.ts` — Prisma client singleton
- `backend/src/lib/redis.ts` — ioredis client singleton
- `backend/src/lib/logger.ts` — Winston logger
- `backend/src/lib/constants.ts` — XP rewards, level thresholds, streak constants

---

### Batch 2: Auth & Gamification (Steps 5–8)

#### [NEW] Auth System (Step 5)
- `backend/src/routes/auth.ts` — register, login, refresh, logout, Google OAuth
- `backend/src/middleware/auth.middleware.ts` — JWT verification
- `backend/src/middleware/validate.middleware.ts` — Zod validation
- `backend/src/middleware/error.middleware.ts` — Global error handler

#### [NEW] Gamification Services (Steps 6–8)
- `backend/src/services/xp.service.ts` — XP calculation, award, level-up check
- `backend/src/services/streak.service.ts` — Increment, reset, freeze logic
- `backend/src/services/badge.service.ts` — Badge definitions, check & award

---

### Batch 3: API Routes (Steps 9–10)

#### [NEW] Core Check-in Routes (Step 9)
- `backend/src/routes/checkins.ts` — POST create, GET today, GET user history, reactions, comments, photo upload

#### [NEW] Remaining Routes (Step 10)
- `backend/src/routes/users.ts` — GET/PATCH me, avatar upload, XP history
- `backend/src/routes/packs.ts` — CRUD, join, feed, members
- `backend/src/routes/badges.ts` — GET all with earned status
- `backend/src/routes/leaderboard.ts` — Pack & global leaderboards
- `backend/src/routes/challenges.ts` — CRUD, join, progress
- `backend/src/routes/notifications.ts` — GET, mark read
- `backend/src/services/minio.service.ts` — Upload, signed URLs
- `backend/src/services/notification.service.ts` — Queue notifications
- `backend/src/services/leaderboard.service.ts` — Redis sorted set operations

---

### Batch 4: Real-Time & Background (Steps 11–13)

#### [NEW] Socket.IO (Step 11)
- `backend/src/lib/socket.ts` — Server setup with JWT auth, pack rooms

#### [NEW] BullMQ (Step 12)
- `backend/src/jobs/queue.ts` — Queue instances
- `backend/src/jobs/notification.job.ts`, `email.job.ts`, `recap.job.ts`
- `backend/src/services/email.service.ts` — Nodemailer

#### [NEW] Cron Jobs (Step 13)
- `backend/src/crons/streak-reset.cron.ts` — Daily 00:05
- `backend/src/crons/pack-streak.cron.ts` — Daily 00:01
- `backend/src/crons/weekly-recap.cron.ts` — Sunday 19:00
- `backend/src/crons/streak-reminder.cron.ts` — Daily 20:00
- `backend/src/crons/battle-resolver.cron.ts` — Hourly

---

### Batch 5: Frontend Foundation (Steps 14–17)

#### [NEW] Next.js Setup (Step 14)
- Initialize Next.js 14 with App Router, TypeScript, Tailwind 3
- Auth guard in `(app)/layout.tsx`
- Zustand stores (`user.ts`, `notifications.ts`)
- Axios instance with interceptors (`lib/api.ts`)
- Socket.IO client singleton (`lib/socket.ts`)
- React Query provider
- Root layout, globals.css

#### [NEW] UI Primitives (Step 15)
- `components/ui/` — Button, Input, Modal, Card, Badge

#### [NEW] Gamification Components (Step 16)
- `components/gamification/` — XPToast, LevelBadge, StreakCounter, XPBar, BadgeUnlock, LevelUpOverlay

#### [NEW] CheckInModal (Step 17)
- `components/checkin/CheckInModal.tsx` — Two-step wizard (workout + meals)
- `components/checkin/CheckInCard.tsx` — Summary card

---

### Batch 6: Frontend Pages (Steps 18–19)

#### [NEW] Pack Feed (Step 18)
- `components/pack/` — PackFeed, PackMemberGrid, PackHeader, ReactionBar
- Socket.IO integration for real-time updates

#### [NEW] All Pages (Step 19)
- `(app)/dashboard/page.tsx`
- `(app)/pack/page.tsx`
- `(app)/leaderboard/page.tsx`
- `(app)/challenges/page.tsx`
- `(app)/profile/page.tsx`
- `(auth)/sign-in/page.tsx`, `sign-up/page.tsx`
- `onboarding/page.tsx`
- `join/[code]/page.tsx`

---

### Batch 7: Infrastructure (Steps 20–23)

#### [NEW] Dockerfiles (Step 20)
- `frontend/Dockerfile` — Multi-stage Next.js build
- `backend/Dockerfile` — Multi-stage Express build

#### [NEW] Docker Compose (Step 21)
- `docker-compose.yml` with all services

#### [NEW] Nginx (Step 22)
- `nginx/nginx.conf` — Reverse proxy config

#### [NEW] Monitoring (Step 23)
- `monitoring/prometheus.yml`
- Grafana provisioning

---

### Batch 8: Deployment & Security (Steps 24–27)
- Deploy scripts, CI/CD, security checklist, monitoring dashboards

---

## Open Questions

> [!IMPORTANT]
> **Shall I begin with Batch 1 (Steps 1–4)?** This includes project scaffolding, TypeScript types, Prisma schema, and Express core setup. I'll proceed batch by batch, verifying each before moving to the next.

> [!NOTE]
> Steps 24–27 (deployment, SSL, load testing) require a real VPS and domain — those steps will be documented but can't be fully executed locally.

## Verification Plan

### Automated Tests
- Backend: TypeScript compilation (`npx tsc --noEmit`), API smoke tests
- Frontend: TypeScript typecheck (`npx tsc --noEmit`), dev server starts successfully
- Docker: `docker compose build` succeeds, `docker compose up` health checks pass

### Manual Verification
- Each batch verified by running the dev server and confirming expected behavior
- API routes tested via browser subagent or curl
- Frontend pages visually verified via browser
