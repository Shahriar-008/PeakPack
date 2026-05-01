# PeakPack Copilot Instructions

## Build, test, and lint commands

Run commands from the package directory unless noted.

| Area | Command | Notes |
|---|---|---|
| Backend install | `cd backend && npm ci` | Uses `package-lock.json` |
| Backend type-check | `cd backend && npm run typecheck` | `tsc --noEmit` |
| Backend build | `cd backend && npm run build` | Outputs to `backend/dist` |
| Backend tests (all) | `cd backend && npm test` | Runs `tsx --test src/**/*.test.ts` |
| Backend single test file | `cd backend && npx tsx --test src\config\env.test.ts` | Replace with target `*.test.ts` file |
| Frontend install | `cd frontend && npm ci` | Uses `package-lock.json` |
| Frontend lint | `cd frontend && npm run lint` | ESLint over `src` and `eslint.config.mjs` |
| Frontend type-check | `cd frontend && npx tsc --noEmit` | Used in CI |
| Frontend build | `cd frontend && npm run build` | Next.js production build |
| Local full stack (Docker) | `docker compose up --build` | Includes nginx, api, worker, postgres, redis, minio, prometheus, grafana |
| Coolify stack file | `docker compose -f docker-compose.coolify.yml config` | Validate Coolify compose before deploy |

## High-level architecture

- Monorepo with two main apps:
  - `frontend/`: Next.js App Router UI (React 19, TypeScript, Tailwind, React Query, Zustand, Supabase client auth).
  - `backend/`: Express API (TypeScript) with Prisma (PostgreSQL), Redis, BullMQ workers, Socket.IO, Prometheus metrics.
- Auth model is Supabase-first: frontend signs in with Supabase, backend validates Supabase bearer tokens, then syncs/creates local Prisma `User` via `POST /api/auth/callback`.
- Realtime + async processing split by process:
  - API process (`backend/src/index.ts`) handles HTTP + Socket.IO + cron scheduling.
  - Worker process (`backend/src/worker.ts`) runs BullMQ jobs (email/notifications/recaps).
- Data model center is in `backend/prisma/schema.prisma` (users, packs, check-ins, XP/badges/challenges/battles) with one-pack-per-user and one-checkin-per-user-per-day constraints.
- Deployment variants:
  - `docker-compose.yml`: self-hosted stack (Postgres/Redis/MinIO + monitoring + nginx).
  - `docker-compose.coolify.yml`: Coolify/Supabase-oriented stack (no nginx/postgres/minio containers; frontend + api + worker).

## Key repository conventions

- API envelope convention:
  - Success responses use `{ data: ... }`.
  - Error responses use `{ error: { message, code, ... } }`.
  Keep this shape consistent across new routes and frontend API typing.
- Route wiring pattern:
  - Mount under `/api/*` in `backend/src/index.ts`.
  - Most feature routes apply `authMiddleware`; validation uses `validate`, `validateQuery`, `validateParams` from `middleware/validate.middleware.ts`.
- Request correlation:
  - `requestContext` middleware normalizes/generates `x-request-id`, stores it on `req.requestId`, and echoes it in response headers.
- Check-in date semantics:
  - Backend normalizes “today” to UTC date-only before persistence; Prisma uses `@db.Date` plus unique `(userId, date)` constraint.
- Frontend API access convention:
  - Use `frontend/src/lib/api.ts` helpers (Axios instance with Supabase token injection + 401 refresh/retry), not ad-hoc fetch calls.
- Client state convention:
  - User/session and notifications are managed via Zustand stores in `frontend/src/store/*`; user store persistence key is `pp-user-store`.
- Socket room/event convention:
  - Server uses `user:{userId}` and `pack:{packId}` rooms and emits canonical events like `checkin:new`, `checkin:reaction`, `checkin:comment`, `user:xp`, `user:level_up`, `user:badge`, `pack:streak`.
- CI gate in `.github/workflows/deploy.yml`:
  - Push to `main` runs backend/frontend type-check before triggering Coolify deploy webhook.

