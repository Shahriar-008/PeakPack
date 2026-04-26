# PeakPack — AI Build Specification
> **Instructions for AI:** This document is a complete, self-contained specification for building the PeakPack web application. Follow each section in order. Do not skip steps. Every decision (stack, schema, file structure, logic) is pre-decided — implement exactly as written. Ask for clarification only if a section is genuinely ambiguous.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema](#5-database-schema)
6. [Authentication](#6-authentication)
7. [Backend API](#7-backend-api)
8. [Gamification Engine](#8-gamification-engine)
9. [Real-Time (Socket.IO)](#9-real-time-socketio)
10. [Frontend Pages & Components](#10-frontend-pages--components)
11. [Background Jobs & Crons](#11-background-jobs--crons)
12. [Self-Hosted Infrastructure](#12-self-hosted-infrastructure)
13. [Docker Compose](#13-docker-compose)
14. [Nginx Config](#14-nginx-config)
15. [CI/CD Pipeline](#15-cicd-pipeline)
16. [Security Rules](#16-security-rules)
17. [Build Order](#17-build-order)

---

## 1. Project Overview

**App Name:** PeakPack  
**Tagline:** Push each other to your best version.  
**Type:** Community-driven fitness & nutrition accountability web app.  
**Deployment:** 100% self-hosted. Docker Compose on a single VPS. No Vercel, no Railway, no third-party managed services.

### What the app does
- Users sign up and set a personal fitness or diet goal.
- Users create or join a **Pack** (group of 5–15 people with a shared goal).
- Every day, users submit a **check-in**: did they work out? how did they eat?
- Check-ins appear in a **real-time Pack feed** that packmates can react to and comment on.
- Every action earns **XP**. XP unlocks **levels**. Consistent check-ins build **streaks**.
- **Badges** are awarded for milestones. **Leaderboards** rank Pack members weekly.
- Packs can run **challenges** and battle other Packs for weekly XP supremacy.

### Phase scope for this build (MVP → Phase 4)
Build Phases 0 through 4. Phase 5 (mobile apps, premium, wearables) is out of scope.

---

## 2. Tech Stack

> **Rule:** Use exactly these technologies. Do not substitute alternatives.

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | Next.js (App Router) | 14.x |
| Frontend language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Animations | Framer Motion | 11.x |
| Icons | Lucide React | latest |
| State management | Zustand | 4.x |
| Server state / cache | TanStack React Query | 5.x |
| HTTP client | Axios | 1.x |
| Backend framework | Node.js + Express | 4.x |
| Backend language | TypeScript | 5.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 16 |
| Cache / queues | Redis (via ioredis) | 7.x |
| Auth | NextAuth.js (JWT, bcrypt, Google OAuth) | 4.x |
| Real-time | Socket.IO | 4.x |
| Media storage | MinIO (S3-compatible, self-hosted) | latest |
| Background jobs | BullMQ (backed by Redis) | 5.x |
| Email | Nodemailer (SMTP) | latest |
| Reverse proxy | Nginx | 1.25+ |
| SSL | Let's Encrypt + Certbot | — |
| Containers | Docker + Docker Compose | latest |
| Monitoring | Prometheus + Grafana | latest |
| Logging | Winston + (optional Grafana Loki) | latest |

---

## 3. Folder Structure

Create this exact structure. Do not deviate.

```
peakpack/
├── frontend/                        # Next.js app
│   ├── src/
│   │   ├── app/                     # App Router pages
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── sign-up/
│   │   │   │       └── page.tsx
│   │   │   ├── (app)/               # Protected routes
│   │   │   │   ├── layout.tsx       # App shell with navbar
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── pack/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── leaderboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── challenges/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── profile/
│   │   │   │       └── page.tsx
│   │   │   ├── onboarding/
│   │   │   │   └── page.tsx
│   │   │   ├── join/
│   │   │   │   └── [code]/
│   │   │   │       └── page.tsx     # Auto-join pack by invite code
│   │   │   ├── layout.tsx           # Root layout
│   │   │   ├── page.tsx             # Redirect to dashboard or sign-in
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                  # Primitives: Button, Input, Modal, Card, Badge
│   │   │   ├── layout/              # Navbar, Sidebar, PageShell
│   │   │   ├── gamification/        # XPToast, LevelBadge, StreakCounter, XPBar, BadgeUnlock
│   │   │   ├── checkin/             # CheckInModal, CheckInCard
│   │   │   ├── pack/                # PackFeed, PackMemberGrid, PackHeader, ReactionBar
│   │   │   ├── leaderboard/         # LeaderboardTable, LeaderboardRow
│   │   │   └── challenge/           # ChallengeCard, ChallengeProgress
│   │   ├── hooks/                   # useCheckin, useSocket, useLeaderboard, usePack
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios instance + typed API functions
│   │   │   ├── socket.ts            # Socket.IO client singleton
│   │   │   └── utils.ts             # cn(), getLevelFromXP(), formatStreak(), getTodayISO()
│   │   ├── store/
│   │   │   ├── user.ts              # Zustand: current user, XP, streak
│   │   │   └── notifications.ts     # Zustand: in-app notification queue
│   │   └── types/
│   │       └── index.ts             # All shared TypeScript types
│   ├── public/
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                         # Express API
│   ├── src/
│   │   ├── routes/                  # One file per resource
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── packs.ts
│   │   │   ├── checkins.ts
│   │   │   ├── badges.ts
│   │   │   ├── leaderboard.ts
│   │   │   ├── challenges.ts
│   │   │   └── notifications.ts
│   │   ├── services/                # Business logic, no HTTP concerns
│   │   │   ├── xp.service.ts        # Award XP, trigger level-up
│   │   │   ├── streak.service.ts    # Increment, reset, freeze logic
│   │   │   ├── badge.service.ts     # Check and award badges
│   │   │   ├── leaderboard.service.ts # Redis sorted set operations
│   │   │   ├── notification.service.ts # Queue notification jobs
│   │   │   ├── minio.service.ts     # Upload, signed URL generation
│   │   │   └── email.service.ts     # Nodemailer send functions
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # Verify JWT, attach req.user
│   │   │   ├── error.middleware.ts  # Global error handler
│   │   │   └── validate.middleware.ts # Zod schema validation
│   │   ├── jobs/                    # BullMQ job definitions
│   │   │   ├── queue.ts             # Queue instances
│   │   │   ├── notification.job.ts
│   │   │   ├── email.job.ts
│   │   │   └── recap.job.ts
│   │   ├── crons/                   # node-cron scheduled tasks
│   │   │   ├── streak-reset.cron.ts # Runs at 00:05 daily
│   │   │   ├── pack-streak.cron.ts  # Runs at 00:01 daily
│   │   │   └── weekly-recap.cron.ts # Runs Sunday 19:00
│   │   ├── lib/
│   │   │   ├── prisma.ts            # Prisma client singleton
│   │   │   ├── redis.ts             # ioredis client singleton
│   │   │   ├── socket.ts            # Socket.IO server setup
│   │   │   └── logger.ts            # Winston logger
│   │   ├── types/
│   │   │   └── index.ts             # Express augmentation (req.user), shared types
│   │   └── index.ts                 # App entry: Express setup, middleware, route mounting
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── tsconfig.json
│   └── package.json
│
├── nginx/
│   └── nginx.conf
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## 4. Environment Variables

Create `.env.example` at project root. Every service reads from environment variables only.

```env
# ── App ──────────────────────────────────────────────
NODE_ENV=production
APP_URL=https://yourdomain.com
API_URL=https://yourdomain.com/api

# ── Database ─────────────────────────────────────────
DATABASE_URL=postgresql://peakpack:STRONG_PASSWORD@postgres:5432/peakpack

# ── Redis ────────────────────────────────────────────
REDIS_URL=redis://redis:6379

# ── Auth (NextAuth.js) ───────────────────────────────
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
JWT_ACCESS_SECRET=generate_with_openssl_rand_base64_32
JWT_REFRESH_SECRET=generate_with_openssl_rand_base64_32
BCRYPT_ROUNDS=12

# ── MinIO (self-hosted object storage) ───────────────
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET_AVATARS=avatars
MINIO_BUCKET_PHOTOS=progress-photos
MINIO_PUBLIC_URL=https://yourdomain.com/media

# ── Email (SMTP) ─────────────────────────────────────
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_smtp_password
EMAIL_FROM="PeakPack <noreply@yourdomain.com>"

# ── Socket.IO ────────────────────────────────────────
SOCKET_CORS_ORIGIN=https://yourdomain.com

# ── Frontend (NEXT_PUBLIC_ prefix = exposed to browser) ──
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com

# ── Monitoring ───────────────────────────────────────
GRAFANA_ADMIN_PASSWORD=generate_strong_password
```

---

## 5. Database Schema

File: `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Enums ────────────────────────────────────────────────────────

enum GoalType {
  weight_loss
  muscle_gain
  endurance
  clean_eating
  custom
}

enum UserLevel {
  Draft
  Rookie
  Grinder
  Beast
  Elite
  Legend
  PEAK
}

enum MealType {
  clean
  cheat
  skip
}

enum PackRole {
  admin
  member
}

enum ReactionType {
  fire
  strong
  letsgo
}

enum ChallengeType {
  personal
  pack
  community
}

// ── Models ───────────────────────────────────────────────────────

model User {
  id               String      @id @default(uuid())
  email            String      @unique
  passwordHash     String?     // null for OAuth users
  name             String
  avatarKey        String?     // MinIO object key
  bio              String?
  goalType         GoalType    @default(custom)
  goalDescription  String?
  xp               Int         @default(0)
  level            UserLevel   @default(Draft)
  streak           Int         @default(0)
  streakFreezes    Int         @default(0)
  notifyPrefs      Json        @default("{}")  // { checkin_reminder: true, streak_risk: true, weekly_recap: true }
  onboardingDone   Boolean     @default(false)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  // Relations
  packMembership   PackMember?
  checkIns         CheckIn[]
  xpEvents         XPEvent[]
  badges           Badge[]
  reactions        Reaction[]
  comments         Comment[]
  sessions         Session[]
  challengeMembers ChallengeParticipant[]
  adminOfPack      Pack?       @relation("PackAdmin")

  @@index([xp])
}

model Session {
  id          String   @id @default(uuid())
  userId      String
  tokenHash   String   @unique
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model Pack {
  id          String     @id @default(uuid())
  name        String
  description String?
  goalType    GoalType
  inviteCode  String     @unique
  adminId     String     @unique
  packStreak  Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  admin       User       @relation("PackAdmin", fields: [adminId], references: [id])
  members     PackMember[]
  challenges  Challenge[]
  battlesAsA  Battle[]   @relation("BattlePackA")
  battlesAsB  Battle[]   @relation("BattlePackB")

  @@index([inviteCode])
}

model PackMember {
  id       String   @id @default(uuid())
  packId   String
  userId   String   @unique   // user can only be in one pack
  role     PackRole @default(member)
  joinedAt DateTime @default(now())

  pack     Pack     @relation(fields: [packId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([packId])
}

model CheckIn {
  id                String    @id @default(uuid())
  userId            String
  date              DateTime  @db.Date           // store as DATE only (no time)
  workoutDone       Boolean   @default(false)
  workoutType       String?
  workoutDurationMins Int?
  mealType          MealType?
  isRestDay         Boolean   @default(false)
  xpEarned          Int       @default(0)
  photoKey          String?   // MinIO key for progress photo
  createdAt         DateTime  @default(now())

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  reactions         Reaction[]
  comments          Comment[]

  @@unique([userId, date])   // one check-in per user per day
  @@index([userId, date])
  @@index([date])
}

model XPEvent {
  id         String   @id @default(uuid())
  userId     String
  actionType String   // e.g. "workout_checkin", "streak_7_day", "badge_unlock"
  xp         Int
  meta       Json?    // { badgeKey: "7_day_warrior" } etc
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}

model Badge {
  id        String   @id @default(uuid())
  userId    String
  badgeKey  String
  earnedAt  DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeKey])   // no duplicate badges
  @@index([userId])
}

model Reaction {
  id         String       @id @default(uuid())
  userId     String
  checkInId  String
  type       ReactionType
  createdAt  DateTime     @default(now())

  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  checkIn    CheckIn @relation(fields: [checkInId], references: [id], onDelete: Cascade)

  @@unique([userId, checkInId, type])
}

model Comment {
  id        String   @id @default(uuid())
  userId    String
  checkInId String
  content   String   @db.VarChar(200)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  checkIn   CheckIn  @relation(fields: [checkInId], references: [id], onDelete: Cascade)

  @@index([checkInId])
}

model Challenge {
  id           String        @id @default(uuid())
  type         ChallengeType
  title        String
  description  String?
  goalMetric   String        // e.g. "workouts:7", "clean_meals:14", "combined_xp:5000"
  packId       String?       // null = personal or community challenge
  createdById  String
  startDate    DateTime
  endDate      DateTime
  createdAt    DateTime      @default(now())

  pack         Pack?         @relation(fields: [packId], references: [id], onDelete: SetNull)
  participants ChallengeParticipant[]

  @@index([packId])
  @@index([endDate])
}

model ChallengeParticipant {
  id          String    @id @default(uuid())
  challengeId String
  userId      String
  progress    Int       @default(0)
  completed   Boolean   @default(false)
  joinedAt    DateTime  @default(now())

  challenge   Challenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([challengeId, userId])
}

model Battle {
  id         String    @id @default(uuid())
  packAId    String
  packBId    String
  startDate  DateTime
  endDate    DateTime
  winnerId   String?
  resolved   Boolean   @default(false)
  createdAt  DateTime  @default(now())

  packA      Pack      @relation("BattlePackA", fields: [packAId], references: [id])
  packB      Pack      @relation("BattlePackB", fields: [packBId], references: [id])

  @@index([endDate, resolved])
}
```

---

## 6. Authentication

### Strategy
- **Email + Password:** bcrypt hash (rounds = `BCRYPT_ROUNDS` env var, default 12). Sign JWT on login.
- **Google OAuth:** Passport.js Google strategy. On first OAuth login, create user record with no `passwordHash`.
- **JWT Tokens:**
  - Access token: RS256 or HS256 with `JWT_ACCESS_SECRET`. Expiry: `15m`.
  - Refresh token: signed with `JWT_REFRESH_SECRET`. Expiry: `30d`. Stored in Redis as `refresh:{userId}:{tokenHash}` with TTL. On logout, delete from Redis (revocation).
- **Middleware:** `auth.middleware.ts` verifies Bearer token from `Authorization` header, attaches `req.user` (typed as `{ id: string; email: string }`).

### Endpoints

```
POST /api/auth/register
  Body: { name, email, password }
  Response: { user, accessToken, refreshToken }

POST /api/auth/login
  Body: { email, password }
  Response: { user, accessToken, refreshToken }

POST /api/auth/refresh
  Body: { refreshToken }
  Response: { accessToken }

POST /api/auth/logout
  Header: Authorization: Bearer <accessToken>
  Action: delete refresh token from Redis
  Response: { success: true }

GET /api/auth/google
  Redirects to Google OAuth consent

GET /api/auth/google/callback
  Handles OAuth callback, returns JWT tokens
```

---

## 7. Backend API

### Global Rules
- All routes except `/api/auth/*` require `auth.middleware.ts`.
- All request bodies are validated with Zod schemas in `validate.middleware.ts`.
- All responses follow: `{ data: T }` for success, `{ error: { message, code } }` for errors.
- Use HTTP status codes correctly: 200, 201, 400, 401, 403, 404, 409, 422, 500.
- Paginated responses: `{ data: T[], pagination: { page, limit, total, hasMore } }`.

### Users

```
GET    /api/users/me
  Returns: current user with packMembership

PATCH  /api/users/me
  Body: { name?, bio?, goalType?, goalDescription? }
  Returns: updated user

POST   /api/users/me/avatar
  Body: multipart/form-data { file: image/* }
  Action: upload to MinIO bucket "avatars", update user.avatarKey
  Returns: { avatarUrl: string }

GET    /api/users/me/xp-history
  Returns: last 50 XPEvent records for current user

GET    /api/users/:id
  Returns: public profile (no email, no passwordHash)
```

### Packs

```
POST   /api/packs
  Body: { name, description?, goalType }
  Action: create pack, set inviteCode (nanoid 8 chars), create PackMember record with role=admin
  Guard: user must not already be in a pack (409 if they are)
  Returns: pack with members

POST   /api/packs/join
  Body: { inviteCode }
  Guard: pack must have < 15 members (400 if full), user must not be in a pack
  Action: create PackMember record
  Returns: pack with members

GET    /api/packs/mine
  Returns: current user's pack with members and recent check-in status

GET    /api/packs/:id/feed
  Query: { page=1, limit=20 }
  Returns: paginated check-ins from pack members, newest first, with reactions and comments
  Guard: user must be member of this pack

GET    /api/packs/:id/members
  Returns: all PackMember records with user data

DELETE /api/packs/:id/members/:userId
  Guard: requester must be pack admin, cannot remove themselves
  Action: delete PackMember record

PATCH  /api/packs/:id
  Body: { name?, description? }
  Guard: requester must be pack admin
  Returns: updated pack
```

### Check-ins

```
POST   /api/checkins
  Body: { workoutDone, workoutType?, workoutDurationMins?, mealType?, isRestDay }
  Guard: only one check-in per user per day (409 if exists for today)
  Action:
    1. Create CheckIn record with date = today (UTC date in user's timezone — use date header or default UTC)
    2. Call xp.service.calculateXP(checkIn) → xpEarned
    3. Update CheckIn.xpEarned
    4. Call xp.service.awardXP(userId, xpEarned, actionType)
    5. Call streak.service.increment(userId)
    6. Call badge.service.checkAndAward(userId)
    7. Emit Socket.IO event 'pack:checkin' to pack room
  Returns: { checkin, xpEarned, newStreak, levelUp?: { newLevel } }

GET    /api/checkins/today
  Returns: today's check-in for current user, or null

GET    /api/checkins/user/:userId
  Query: { limit=30 }
  Returns: recent check-ins for a user (only within same pack)

POST   /api/checkins/:id/react
  Body: { type: "fire" | "strong" | "letsgo" }
  Action: upsert Reaction (toggle off if same type exists), award +10 XP to check-in owner, emit Socket event
  Returns: updated reactions array

POST   /api/checkins/:id/comment
  Body: { content } (max 200 chars)
  Action: create Comment, emit Socket event
  Returns: created comment with user data

POST   /api/checkins/:id/photo
  Body: multipart/form-data { file: image/* }
  Action: upload to MinIO "progress-photos" bucket, update checkIn.photoKey, award +30 XP
  Returns: { photoUrl }
```

### Badges

```
GET    /api/badges
  Returns: all badge definitions merged with user's earned badges
  Format: { key, name, description, emoji, category, earned: boolean, earnedAt?: Date }
```

### Leaderboard

```
GET    /api/leaderboard/pack/:packId
  Returns: weekly leaderboard for pack members (from Redis sorted set)
  Format: [{ rank, user, weeklyXp, streak, level }]

GET    /api/leaderboard/global
  Query: { limit=100 }
  Returns: global weekly leaderboard top N users
```

### Challenges

```
POST   /api/challenges
  Body: { type, title, description?, goalMetric, packId?, startDate, endDate }
  Returns: created challenge

GET    /api/challenges
  Query: { type?, packId? }
  Returns: challenges visible to current user

POST   /api/challenges/:id/join
  Action: create ChallengeParticipant record
  Returns: updated challenge with participant count

PATCH  /api/challenges/:id/progress
  Body: { progress }
  Action: update participant progress, check completion, award XP if completed
  Returns: updated participant record
```

### Notifications

```
GET    /api/notifications
  Returns: last 20 in-app notifications for user (from Redis list)

PATCH  /api/notifications/read-all
  Action: mark all as read
```

---

## 8. Gamification Engine

### XP Constants
Define in `backend/src/lib/constants.ts`:

```typescript
export const XP_REWARDS = {
  workout_checkin:        50,
  clean_meal:             20,
  rest_day:               15,
  encourage_packmate:     10,   // per reaction given
  streak_7_day:           200,
  perfect_week:           500,
  complete_challenge:     300,
  progress_photo:         30,
  pack_streak_bonus:      25,   // per member when whole pack checks in
} as const;

export const LEVEL_THRESHOLDS = {
  Draft:   0,
  Rookie:  500,
  Grinder: 1500,
  Beast:   3500,
  Elite:   7000,
  Legend:  13000,
  PEAK:    25000,
} as const;

export const STREAK_FREEZE_MAX = 3;
export const STREAK_FREEZE_EARN_INTERVAL = 7; // earn 1 per 7-day streak milestone
```

### XP Service (`xp.service.ts`)

```typescript
// calculateXP(checkIn): compute XP for a check-in
//   +50 if workoutDone
//   +20 if mealType === "clean"
//   +15 if isRestDay
// Returns: number

// awardXP(userId, xp, actionType, meta?):
//   1. Increment user.xp by xp (Prisma update)
//   2. Write XPEvent record
//   3. ZINCRBY Redis key leaderboard:pack:{packId}:{isoWeek} xp userId
//   4. ZINCRBY Redis key leaderboard:global:{isoWeek} xp userId
//   5. Set TTL on leaderboard keys to 14 days if not already set
//   6. Call checkLevelUp(userId, newTotalXP)
// Returns: { xpAwarded, newTotal, levelUp? }

// checkLevelUp(userId, totalXP):
//   Compute new level from LEVEL_THRESHOLDS
//   If new level !== user.level: update DB, emit 'user:levelup' Socket event, award level badge
```

### Streak Service (`streak.service.ts`)

```typescript
// increment(userId):
//   1. Load user.streak and user.streakFreezes
//   2. Increment streak by 1, update DB
//   3. If streak % 7 === 0: award streak bonus XP, earn freeze (if < STREAK_FREEZE_MAX), check milestone badge
//   4. If streak === 7 and perfect week: award perfect_week XP
//   Returns: newStreak

// resetMissed():  [called by cron at 00:05]
//   1. Find all users who have no check-in for yesterday AND streak > 0
//   2. For each: if streakFreezes > 0: decrement freezes, keep streak, notify user "freeze used"
//   3. Else: set streak = 0, notify user "streak broken"

// checkPackStreak(packId):  [called by cron at 00:01]
//   1. Count distinct users who checked in yesterday for this pack
//   2. If count === pack.memberCount: increment pack.packStreak, award XP to all members
```

### Badge Service (`badge.service.ts`)

Define all badge definitions as a constant array:

```typescript
export const BADGE_DEFINITIONS = [
  // Fitness
  { key: "first_workout",    name: "First Step",        emoji: "👟", category: "fitness",   condition: "total_workouts >= 1" },
  { key: "7_day_warrior",    name: "7-Day Warrior",     emoji: "🗡️", category: "fitness",   condition: "streak >= 7" },
  { key: "30_day_beast",     name: "30-Day Beast",      emoji: "🦁", category: "fitness",   condition: "streak >= 30" },
  { key: "100_workouts",     name: "Century Club",      emoji: "💯", category: "fitness",   condition: "total_workouts >= 100" },
  { key: "iron_week",        name: "Iron Week",         emoji: "🏋️", category: "fitness",   condition: "workouts_this_week >= 7" },
  // Diet
  { key: "clean_week",       name: "Clean Week",        emoji: "🥗", category: "diet",      condition: "clean_meals_streak >= 7" },
  { key: "30_day_clean",     name: "30-Day Clean",      emoji: "🌿", category: "diet",      condition: "clean_meals_streak >= 30" },
  { key: "zero_cheat_month", name: "Zero Cheat Month",  emoji: "🧘", category: "diet",      condition: "zero_cheat_meals_this_month" },
  // Community
  { key: "pack_igniter",     name: "Pack Igniter",      emoji: "🔥", category: "community", condition: "reactions_given_this_week >= 20" },
  { key: "mvp_of_week",      name: "MVP of the Week",   emoji: "👑", category: "community", condition: "top_weekly_xp_in_pack" },
  { key: "pack_leader",      name: "Pack Leader",       emoji: "🚀", category: "community", condition: "is_pack_admin" },
  // Level badges (auto-awarded on level up)
  { key: "level_rookie",     name: "Rookie",            emoji: "🌱", category: "level",     condition: "level === Rookie" },
  { key: "level_grinder",    name: "Grinder",           emoji: "⚙️", category: "level",     condition: "level === Grinder" },
  { key: "level_beast",      name: "Beast",             emoji: "🦁", category: "level",     condition: "level === Beast" },
  { key: "level_elite",      name: "Elite",             emoji: "💎", category: "level",     condition: "level === Elite" },
  { key: "level_legend",     name: "Legend",            emoji: "🌟", category: "level",     condition: "level === Legend" },
  { key: "level_peak",       name: "PEAK",              emoji: "🏔️", category: "level",     condition: "level === PEAK" },
] as const;

// checkAndAward(userId):
//   1. Load user stats (total_workouts, streak, xp, level, pack membership, weekly reaction count)
//   2. For each BADGE_DEFINITION: evaluate condition against stats
//   3. If condition met and badge not already earned: call awardBadge(userId, badgeKey)

// awardBadge(userId, badgeKey):
//   1. Write Badge record (unique constraint handles race conditions gracefully)
//   2. Emit 'user:badge' Socket event with badge definition
//   3. Push in-app notification to user
```

---

## 9. Real-Time (Socket.IO)

### Server Setup (`backend/src/lib/socket.ts`)

```typescript
// On connection:
//   1. Verify JWT from handshake.auth.token
//   2. If invalid: socket.disconnect()
//   3. Attach socket.data.userId
//   4. Load user's packId from DB (or Redis cache)
//   5. socket.join(`pack:${packId}`)
//   6. socket.join(`user:${userId}`)

// Rooms:
//   pack:{packId}   — all members of a pack
//   user:{userId}   — direct notifications to one user
```

### Events emitted by server

| Event | Room | Payload |
|---|---|---|
| `pack:checkin` | `pack:{packId}` | `{ checkIn, user, xpEarned }` |
| `checkin:reaction` | `pack:{packId}` | `{ checkInId, reactions }` |
| `checkin:comment` | `pack:{packId}` | `{ checkInId, comment }` |
| `user:levelup` | `user:{userId}` | `{ newLevel, previousLevel }` |
| `user:badge` | `user:{userId}` | `{ badge: BadgeDefinition }` |
| `user:notification` | `user:{userId}` | `{ type, title, body }` |
| `pack:streak` | `pack:{packId}` | `{ packStreak, bonusXP }` |
| `battle:update` | `pack:{packId}` | `{ battle, packAXP, packBXP }` |

### Client Usage (`frontend/src/lib/socket.ts`)

```typescript
// Singleton pattern — only one connection per browser session
// Connect on: successful login
// Disconnect on: logout
// Reconnect: Socket.IO handles automatically with exponential backoff

// useSocket() hook:
//   Subscribe to events for the active page
//   Clean up listeners on unmount (socket.off)
//   Update Zustand store on relevant events
//   Trigger toast/overlay on levelup and badge events
```

---

## 10. Frontend Pages & Components

### Global Rules
- All protected pages live under `(app)/` route group with an auth guard in `layout.tsx`.
- Auth guard: if no session, redirect to `/sign-in`.
- If session exists but `onboardingDone === false`, redirect to `/onboarding`.
- Use TanStack React Query for all server data fetching — no raw useEffect fetches.
- Use Zustand only for: current user state, real-time Socket.IO updates, UI state (modals open/closed).
- All forms use controlled components with Zod validation on submit.
- All images use Next.js `<Image>` component with MinIO URL as src.

### Page Specifications

#### `/sign-in`
- Email + password form.
- "Continue with Google" button.
- Link to `/sign-up`.
- On success: store tokens, redirect to `/dashboard` or `/onboarding`.

#### `/sign-up`
- Name, email, password, confirm password fields.
- "Continue with Google" button.
- On success: redirect to `/onboarding`.

#### `/onboarding`
Three-step wizard. Step state managed in component (not URL).

- **Step 1 — Goal:** Select goal type (weight_loss, muscle_gain, endurance, clean_eating, custom). If custom: text input for goal description.
- **Step 2 — Pack:** Option A: Create a pack (name, description, goal type). Option B: Enter an invite code to join. Option C: Skip for now.
- **Step 3 — Profile:** Upload avatar (optional), enter bio (optional). Click "Let's Go".
- On complete: PATCH `/api/users/me` with `{ onboardingDone: true }`, redirect to `/dashboard`.

#### `/dashboard`
- **Header:** greeting (Good morning/afternoon/evening), streak counter.
- **Check-in card:** if no check-in today → "Check In Now" button. If done → summary of today's check-in.
- **XP bar:** current XP progress toward next level, level badge.
- **Pack mini-feed:** last 5 check-ins from packmates (real-time via Socket.IO).
- **Quick stats:** weekly XP, pack rank, active challenges count.
- **Check-in modal:** triggered by "Check In Now" button (see CheckInModal spec below).

#### `/pack`
- **Pack header:** pack name, goal, pack streak, member count, invite link (copy button).
- **Member grid:** avatar, name, level badge, today's check-in status (done ✅ / not yet ⏳).
- **Activity feed:** full paginated feed of pack check-ins. Infinite scroll (load more on scroll). Real-time new check-ins prepend to top via Socket.IO.
- **Feed card:** avatar, name, level badge, time ago, workout summary, meal badge, reaction bar (fire/strong/letsgo count + tap to react), comment thread (collapsed by default, expand on tap).
- **Challenges tab:** pack challenges and battles.

#### `/leaderboard`
- Tabs: "My Pack" | "Global".
- Table columns: Rank, Avatar + Name, Level, Weekly XP, Streak.
- Current user row highlighted.
- Resets shown: "Resets Monday" with countdown timer.

#### `/challenges`
- List of active challenges (personal + pack + community).
- "Create challenge" button (modal).
- Challenge card: title, type badge, progress bar, end date, participant count.
- Preset challenges: horizontal scroll row with one-tap join.

#### `/profile`
- Avatar (tap to upload new).
- Name, bio (edit inline).
- Level badge + XP progress bar.
- Streak counter + freeze bank count.
- Badges shelf: grid of all badge definitions. Earned = full color. Locked = gray + lock icon.
- Recent check-in history: last 14 days as dots (green = workout done, orange = rest, red = missed, gray = future).

### Component Specifications

#### `CheckInModal`
Bottom sheet on mobile, centered modal on desktop. Two steps.

**Step 1 — Workout:**
- Three buttons: "💪 Worked Out", "😴 Rest Day", "❌ Skipped".
- If "Worked Out": show workout type pill selector (Gym, Run, Cycling, Swimming, HIIT, Yoga, Walk, Other) + duration range slider (5–180 min, step 5).
- Next button → Step 2.

**Step 2 — Meals:**
- Three buttons: "🥗 Clean", "🍕 Cheat", "⏭️ Skip".
- Optional: photo upload button.
- "Check In 🔥" submit button.
- On success: close modal, show XPToast, update feed via Socket.IO event.

#### `XPToast`
- Fixed position, bottom center.
- Appears for 2.5 seconds.
- Shows: `+{xp} XP 🔥`.
- Entry animation: scale up from 0.7 + translateY from 20px.
- Exit animation: fade + translateY up.

#### `LevelUpOverlay`
- Full-screen overlay triggered by `user:levelup` Socket event.
- Shows: old level → new level, level name in large text, brief celebration animation.
- Dismiss after 4 seconds or on tap.

#### `BadgeUnlockOverlay`
- Full-screen overlay triggered by `user:badge` Socket event.
- Shows: badge emoji (large, animated spin-in), badge name, description.
- Dismiss after 3 seconds or on tap.

#### `StreakCounter`
- Flame icon (orange when streak > 0, gray when streak === 0).
- Number next to flame.
- Gentle pulse animation when streak > 0.

#### `XPBar`
- Progress bar from current level threshold to next level threshold.
- Label: "Level Name · {current}/{needed} XP".
- Animated fill on XP gain via Framer Motion `animate` prop.

#### `ReactionBar`
- Three emoji buttons: 🔥 Strong 👊.
- Show count next to each.
- Tap to react: optimistic UI update immediately, API call in background.
- If already reacted with same type: toggle off.
- Award XP to check-in owner (handled server-side).

---

## 11. Background Jobs & Crons

### BullMQ Queues (in `backend/src/jobs/queue.ts`)

```typescript
// Queue: "notifications"
//   Job: send_in_app   → push notification to Redis list for user, emit Socket event
//   Job: send_email    → call email.service.sendEmail()

// Queue: "emails"
//   Job: welcome_email
//   Job: streak_risk_warning
//   Job: weekly_recap
//   Job: badge_unlock_email
```

### Cron Jobs (in `backend/src/crons/`)

#### `streak-reset.cron.ts` — runs daily at `00:05`
```
1. Find all users with streak > 0 who have no CheckIn for yesterday (date comparison in UTC)
2. For each user:
   a. If user.streakFreezes > 0:
      - Decrement streakFreezes by 1
      - Keep streak unchanged
      - Add notification job: "Freeze used! Your streak is safe for now."
   b. Else:
      - Set user.streak = 0
      - Add notification job: "Your streak was broken. Start fresh today!"
3. Log total affected users
```

#### `pack-streak.cron.ts` — runs daily at `00:01`
```
1. For each Pack:
   a. Count members who checked in yesterday
   b. If count === pack.memberCount AND memberCount > 0:
      - Increment pack.packStreak
      - For each member: call xp.service.awardXP(userId, XP_REWARDS.pack_streak_bonus, "pack_streak_bonus")
      - Emit 'pack:streak' Socket event to pack room
   c. Else:
      - Reset pack.packStreak to 0
```

#### `weekly-recap.cron.ts` — runs every Sunday at `19:00`
```
1. For each user with notifyPrefs.weekly_recap === true:
   a. Calculate this week's XP (sum XPEvents for current ISO week)
   b. Get pack rank from Redis leaderboard
   c. Get top packmate (highest weekly XP)
   d. Queue email job: weekly recap email
```

#### `streak-reminder.cron.ts` — runs daily at `20:00`
```
1. Find all users with no check-in today AND streak > 0 AND notifyPrefs.checkin_reminder === true
2. For each: queue notification job "Your streak is at risk! Check in before midnight."
```

#### `battle-resolver.cron.ts` — runs every hour
```
1. Find Battles where endDate < now AND resolved === false
2. For each battle:
   a. Get weekly XP for packA and packB from Redis leaderboards for the battle week
   b. Determine winner (higher XP)
   c. Set battle.winnerId, battle.resolved = true
   d. Award trophy badge to all winning pack members
   e. Emit Socket event to both pack rooms
```

---

## 12. Self-Hosted Infrastructure

### Minimum Server Requirements

| Environment | CPU | RAM | Storage |
|---|---|---|---|
| Development | 2 vCPU | 4 GB | 30 GB SSD |
| Production (launch) | 4 vCPU | 8 GB | 100 GB SSD |
| Production (growth) | 8 vCPU | 16 GB | 200 GB SSD |
| Database (separate) | 4 vCPU | 8 GB | 200 GB SSD |
| Media (MinIO) | 2 vCPU | 4 GB | 500 GB HDD |

### Initial Server Setup (Ubuntu 22.04)

```bash
# 1. Update system
apt update && apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

# 3. Install Docker Compose plugin
apt install docker-compose-plugin -y

# 4. Install Certbot
snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot

# 5. Install Nginx
apt install nginx -y

# 6. Configure firewall (UFW)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# 7. Clone repo
git clone https://github.com/yourorg/peakpack.git /opt/peakpack
cd /opt/peakpack
cp .env.example .env
# Fill in .env with real values

# 8. Run migrations
docker compose run --rm api npx prisma migrate deploy

# 9. Start all services
docker compose up -d

# 10. Get SSL
certbot --nginx -d yourdomain.com -d api.yourdomain.com

# 11. Set up auto-backup cron
crontab -e
# Add: 0 2 * * * /opt/peakpack/scripts/backup.sh
```

### Backup Script (`scripts/backup.sh`)

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/opt/backups/peakpack"
mkdir -p $BACKUP_DIR

# 1. Database backup
docker compose exec -T postgres pg_dump -U peakpack peakpack \
  | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 2. Optional: encrypt backup
# gpg --symmetric --cipher-algo AES256 $BACKUP_DIR/db_$DATE.sql.gz

# 3. Sync MinIO media to backup location
# mc mirror myminio/avatars $BACKUP_DIR/avatars/
# mc mirror myminio/progress-photos $BACKUP_DIR/photos/

# 4. Delete backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup complete: $DATE"
```

---

## 13. Docker Compose

File: `docker-compose.yml`

```yaml
version: "3.9"

networks:
  peakpack:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:
  grafana_data:
  prometheus_data:

services:

  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
    depends_on:
      - frontend
      - api
      - minio
    networks:
      - peakpack
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    expose:
      - "3000"
    depends_on:
      - api
    networks:
      - peakpack
    restart: unless-stopped

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - BCRYPT_ROUNDS=${BCRYPT_ROUNDS}
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_USE_SSL=false
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET_AVATARS=${MINIO_BUCKET_AVATARS}
      - MINIO_BUCKET_PHOTOS=${MINIO_BUCKET_PHOTOS}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - EMAIL_FROM=${EMAIL_FROM}
      - SOCKET_CORS_ORIGIN=${SOCKET_CORS_ORIGIN}
    expose:
      - "4000"
    depends_on:
      - postgres
      - redis
      - minio
    networks:
      - peakpack
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: node dist/worker.js
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - EMAIL_FROM=${EMAIL_FROM}
    depends_on:
      - postgres
      - redis
    networks:
      - peakpack
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=peakpack
      - POSTGRES_USER=peakpack
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    expose:
      - "5432"
    networks:
      - peakpack
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U peakpack"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    expose:
      - "6379"
    networks:
      - peakpack
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    expose:
      - "9000"
      - "9001"
    networks:
      - peakpack
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    expose:
      - "9090"
    networks:
      - peakpack
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
    expose:
      - "3001"
    depends_on:
      - prometheus
    networks:
      - peakpack
    restart: unless-stopped
```

---

## 14. Nginx Config

File: `nginx/nginx.conf`

```nginx
events {
  worker_connections 1024;
}

http {
  include       mime.types;
  default_type  application/octet-stream;

  # Logging
  access_log /var/log/nginx/access.log;
  error_log  /var/log/nginx/error.log;

  # Gzip
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml;

  # Rate limiting zones
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
  limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

  # Upstream services
  upstream frontend { server frontend:3000; }
  upstream api      { server api:4000; }
  upstream minio    { server minio:9000; }
  upstream grafana  { server grafana:3001; }

  # HTTP → HTTPS redirect
  server {
    listen 80;
    server_name yourdomain.com;

    location /.well-known/acme-challenge/ {
      root /var/www/certbot;
    }

    location / {
      return 301 https://$host$request_uri;
    }
  }

  # Main HTTPS server
  server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # API routes
    location /api/ {
      limit_req zone=api_limit burst=20 nodelay;
      proxy_pass http://api;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Auth rate limit
    location /api/auth/ {
      limit_req zone=auth_limit burst=5 nodelay;
      proxy_pass http://api;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO (requires upgrade headers for WebSocket)
    location /socket.io/ {
      proxy_pass http://api;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_cache_bypass $http_upgrade;
    }

    # MinIO media (public read for avatar and photo buckets)
    location /media/ {
      proxy_pass http://minio/;
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }

    # Grafana (protect with basic auth or VPN in production)
    location /grafana/ {
      proxy_pass http://grafana/;
      proxy_set_header Host $host;
    }

    # Frontend (all other routes)
    location / {
      proxy_pass http://frontend;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
```

---

## 15. CI/CD Pipeline

### Deployment Script (`scripts/deploy.sh`)

```bash
#!/bin/bash
set -e

echo "=== PeakPack Deploy ==="

# 1. Pull latest code
cd /opt/peakpack
git pull origin main

# 2. Build new images
docker compose build frontend api

# 3. Run DB migrations (in isolated container, exits 0 on success)
docker compose run --rm api npx prisma migrate deploy

# 4. Zero-downtime rolling update
#    Update API first (two replicas if configured)
docker compose up -d --no-deps api worker

# 5. Health check API
echo "Waiting for API health check..."
for i in {1..12}; do
  if curl -sf http://localhost:4000/api/health; then
    echo "API healthy."
    break
  fi
  if [ $i -eq 12 ]; then
    echo "API failed health check. Rolling back..."
    git stash
    docker compose up -d --no-deps api
    exit 1
  fi
  sleep 5
done

# 6. Deploy frontend
docker compose up -d --no-deps frontend

# 7. Cleanup old images
docker image prune -f

echo "=== Deploy complete ==="
```

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: cd backend && npm ci && npm run test
      - run: cd frontend && npm ci && npm run typecheck

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: /opt/peakpack/scripts/deploy.sh
```

---

## 16. Security Rules

Implement all of the following. No exceptions.

### API
- [ ] Rate limiting: 100 req/min per IP (Nginx), 10 req/min on `/api/auth/*`
- [ ] Helmet.js on Express: `app.use(helmet())`
- [ ] CORS: `origin: process.env.SOCKET_CORS_ORIGIN` — no wildcard
- [ ] All user input validated with Zod before reaching service layer
- [ ] Prisma parameterised queries only — never string-concatenated SQL
- [ ] File uploads: validate MIME type (image/jpeg, image/png, image/webp only), max 5MB
- [ ] XSS: sanitise comment content with `dompurify` (server-side with `jsdom`)

### Auth
- [ ] bcrypt rounds ≥ 12 (set via env)
- [ ] JWT access token expiry: 15 minutes
- [ ] Refresh token stored in Redis with TTL, deleted on logout (revocable)
- [ ] Google OAuth: only use verified email from profile

### Infrastructure
- [ ] Firewall: only ports 22, 80, 443 open publicly
- [ ] SSH: key-based auth only — `PasswordAuthentication no` in sshd_config
- [ ] Docker: API and frontend containers run as non-root user (`USER node` in Dockerfile)
- [ ] Postgres user `peakpack` has only: SELECT, INSERT, UPDATE, DELETE — no DDL permissions
- [ ] All secrets in `.env` only — never in source code or Docker image
- [ ] Backups encrypted before storage (gpg or age)

---

## 17. Build Order

Follow this exact sequence. Do not start a step before the previous one passes.

```
Step 1:  Set up repo structure exactly as specified in Section 3
Step 2:  Write all TypeScript types (frontend/src/types/index.ts)
Step 3:  Write Prisma schema (Section 5) and run first migration
Step 4:  Set up Express app (index.ts), Prisma client, Redis client, Winston logger
Step 5:  Implement auth routes + middleware (Section 6)
Step 6:  Write XP service and constants (Section 8)
Step 7:  Write Streak service (Section 8)
Step 8:  Write Badge service and definitions (Section 8)
Step 9:  Implement check-in routes — this is the core loop (Section 7)
Step 10: Implement users, packs, badges, leaderboard routes
Step 11: Set up Socket.IO server with JWT auth and pack rooms (Section 9)
Step 12: Set up BullMQ queues and worker (Section 11)
Step 13: Set up cron jobs (Section 11)
Step 14: Set up Next.js app with auth, Zustand stores, Axios client, React Query
Step 15: Build UI primitives (Button, Input, Modal, Card, Badge)
Step 16: Build gamification components (XPToast, LevelBadge, StreakCounter, XPBar)
Step 17: Build CheckInModal
Step 18: Build Pack feed with real-time Socket.IO integration
Step 19: Build remaining pages (dashboard, leaderboard, challenges, profile)
Step 20: Write Dockerfiles for frontend and backend
Step 21: Write docker-compose.yml (Section 13)
Step 22: Write nginx.conf (Section 14)
Step 23: First full local Docker Compose run — smoke test all services
Step 24: Deploy to server, run migrations, SSL setup
Step 25: Run security checklist (Section 16) — fix any gaps
Step 26: Load test with k6 — target p95 API < 200ms
Step 27: Set up Grafana dashboards and Prometheus alerts
```

---

> **End of specification.**
> All architectural decisions are final. Implement, do not redesign.
> When in doubt about a detail not covered here, apply the principle of least surprise — do what a senior developer would consider the obvious correct choice.