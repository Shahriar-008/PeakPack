# PeakPack

Community-driven fitness and nutrition accountability app.

## Phase 0 foundation delivered

- Next.js 14 + TypeScript + Tailwind setup
- Clerk auth shell (landing, sign-in, sign-up, protected dashboard)
- Prisma + PostgreSQL schema for users, packs, check-ins, XP, badges, reactions, comments, challenges
- Upstash Redis and Cloudinary service adapters
- Supabase realtime client bootstrap
- Base UI components (`Button`, `Card`, `Input`, `Modal`)
- Local infra with Docker Compose (Postgres + Redis)
- CI workflow for lint, typecheck, and build

## Quick start

1. Copy env template:
   - `Copy-Item .env.example .env`
2. Start local services:
   - `docker compose up -d`
3. Install dependencies:
   - `npm install`
4. Generate Prisma client:
   - `npm run db:generate`
5. Run migrations:
   - `npm run db:migrate`
6. Start app:
   - `npm run dev`

## Core scripts

- `npm run dev` - local dev server
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript check
- `npm run build` - production build
- `npm run db:generate` - Prisma client generation
- `npm run db:migrate` - apply migration
- `npm run db:studio` - open Prisma Studio

## Deployment baseline

- Frontend: Vercel
- Data + backend services: Railway or VPS Docker Compose
- Realtime: Supabase

## Remaining manual platform setup

- Create Clerk app and configure OAuth providers
- Provision Upstash Redis, Supabase project, and Cloudinary account
- Configure GitHub branch protection and review rules
