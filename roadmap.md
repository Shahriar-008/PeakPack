# 🏋️ PeakPack — Product Roadmap

> A community-driven fitness & nutrition accountability app where small groups (Packs) push each other toward their personal best version.

---

## 🧭 Vision

Build the go-to platform where people don't just track fitness — they **commit publicly, compete kindly, and grow together**. Starting with fitness and clean eating, expanding into a full lifestyle accountability ecosystem.

---

## 📌 Guiding Principles

- **Community over solo** — every feature should connect people, not isolate them
- **Progress over perfection** — celebrate consistency, never shame missed days
- **Simple first** — launch lean, validate fast, add complexity only when needed
- **Gamification with purpose** — XP and badges should feel earned, not hollow

---

## 🗺️ Roadmap Overview

| Phase | Name | Timeline | Status |
|-------|------|----------|--------|
| 0 | Foundation | Weeks 1–2 | In Progress |
| 1 | MVP — Core Loop | Weeks 3–8 | Not Started |
| 2 | Gamification Engine | Weeks 9–13 | Not Started |
| 3 | Social & Challenges | Weeks 14–18 | Not Started |
| 4 | Growth & Polish | Weeks 19–24 | Not Started |
| 5 | Scale & Expand | Month 7+ | Future |

---

## ⚙️ Phase 0 — Foundation
**Timeline: Weeks 1–2**

Set up the project infrastructure before writing any product code.

### Goals
- Finalize tech stack and project structure
- Set up dev, staging, and production environments
- Establish coding standards and CI/CD pipeline

### Tasks
- [x] Initialize Next.js project with TypeScript and Tailwind CSS
- [x] Set up PostgreSQL database with Prisma ORM
- [x] Configure Redis (Upstash) for caching and leaderboards
- [ ] Set up Vercel (frontend) and Railway (backend/database) hosting
- [x] Integrate Clerk for authentication (Google + email/password)
- [x] Configure Cloudinary for media/image storage
- [ ] Set up GitHub repository with branch protection and PR reviews
- [x] Create base UI component library (buttons, cards, inputs, modals)
- [x] Define database schema (users, packs, check-ins, XP, badges)

### Deliverables
- Working local dev environment
- Deployed skeleton app (login/signup only)
- Database schema v1 documented and migrated

---

## 🚀 Phase 1 — MVP Core Loop
**Timeline: Weeks 3–8**

Build the minimum experience that delivers real value: a user can set a goal, join a pack, and check in daily.

### Goals
- Users can sign up, create a profile, and set a fitness goal
- Users can create or join a Pack
- Users can perform daily check-ins for workout and meals
- Packmates can see each other's activity

### Features

#### 1.1 — User Profile & Goal Setting (Week 3)
- [ ] Onboarding flow: name, avatar upload, fitness goal
- [ ] Goal types: Weight Loss / Muscle Gain / Endurance / Clean Eating / Custom
- [ ] Goal details: target, timeframe, current status
- [ ] Profile page: avatar, bio, goal, streak, XP level

#### 1.2 — Packs (Week 4)
- [ ] Create a Pack: name, goal type, description, invite code
- [ ] Join a Pack via invite link or code
- [ ] Pack page: member list, shared goal, activity feed
- [ ] Pack size limit: 5–15 members (enforced)
- [ ] Pack admin role: creator can remove members or update Pack info

#### 1.3 — Daily Check-in System (Weeks 5–6)
- [ ] Check-in modal: Workout (yes/no + type + duration) & Meals (Clean / Cheat / Skip)
- [ ] One check-in per day per user
- [ ] Check-in deadline: midnight (user's local timezone)
- [ ] Rest Day option (counts as active, no streak break)
- [ ] Check-in confirmation with XP earned shown
- [ ] Streak counter: increments on successful check-in, resets on miss

#### 1.4 — Pack Activity Feed (Weeks 7–8)
- [ ] Real-time feed of packmates' check-ins (Pusher or Supabase Realtime)
- [ ] Feed items: workout logged, meal logged, streak milestone
- [ ] Reactions: 🔥 Fire, 💪 Strong, 👊 Let's Go (quick taps)
- [ ] Comments on check-ins (short, encouragement-focused)
- [ ] Notification when a packmate checks in

### Deliverables
- End-to-end working MVP
- At least 1 internal test Pack running for 2 weeks

---

## 🎮 Phase 2 — Gamification Engine
**Timeline: Weeks 9–13**

Layer XP, levels, streaks, and badges on top of the core loop to create habit-forming engagement.

### Goals
- Every action earns XP and contributes to a visible level
- Streaks are tracked and protected
- Badges reward meaningful milestones

### Features

#### 2.1 — XP & Leveling System (Week 9)
- [ ] XP engine: award points per action in real time

| Action | XP |
|---|---|
| Daily workout check-in | +50 XP |
| Clean meal logged | +20 XP |
| Rest day check-in | +15 XP |
| Comment / encourage packmate | +10 XP |
| 7-day streak bonus | +200 XP |
| Perfect week (all 7 days) | +500 XP |
| Complete a challenge | +300 XP |
| Post progress photo | +30 XP |

- [ ] Level system with 7 tiers:
  > **Draft → Rookie → Grinder → Beast → Elite → Legend → PEAK**
- [ ] Animated XP gain notification on check-in
- [ ] Level-up screen with celebration animation (Framer Motion)
- [ ] XP history log (viewable on profile)

#### 2.2 — Streak System (Week 10)
- [ ] Daily streak counter displayed prominently on profile and home screen
- [ ] Streak freeze: earn 1 freeze per completed 7-day streak
- [ ] Freeze bank: max 3 freezes held at a time
- [ ] Apply freeze: auto-prompt when user misses a day ("Use a freeze?")
- [ ] Pack streak: bonus XP when ALL packmates check in on same day
- [ ] Streak milestone alerts: 7, 14, 30, 60, 100 days

#### 2.3 — Badge System (Weeks 11–12)
- [ ] Badge display on profile (earned badges shown, locked ones grayed)
- [ ] Fitness badges:
  - 🥇 First Workout, 7-Day Warrior, 30-Day Beast, 100 Workouts
  - 🏃 Iron Week (7 workouts in 7 days), Early Bird (check-in before 8am x5)
- [ ] Diet badges:
  - 🥗 Clean Week, 30-Day Clean Eater, Zero Cheat Month
  - 💧 Hydration Hero, Meal Prep King/Queen
- [ ] Community badges:
  - 🔥 Pack Igniter (most encouragements in a week), MVP of the Week
  - 👑 Pack Leader, Top 3 Leaderboard (weekly)
- [ ] Badge unlock notification with animation

#### 2.4 — Leaderboard (Week 13)
- [ ] Pack leaderboard: ranked by weekly XP within your Pack
- [ ] Leaderboard resets every Monday (fresh competition each week)
- [ ] Global leaderboard: top 100 users by all-time XP
- [ ] City/region leaderboard (based on profile location)
- [ ] Weekly leaderboard recap sent as in-app notification on Sunday evening

### Deliverables
- Full gamification system live
- Internal beta test with feedback round

---

## 🤝 Phase 3 — Social & Challenges
**Timeline: Weeks 14–18**

Add structured challenges and pack vs. pack competition to deepen social engagement.

### Goals
- Users can create and join time-bound challenges
- Packs can compete against each other
- Community events drive app-wide participation

### Features

#### 3.1 — Personal Challenges (Week 14)
- [ ] Create a challenge: name, type (fitness/diet), duration, goal metric
- [ ] Example presets: "No sugar for 7 days", "Run 3x this week", "10,000 steps daily"
- [ ] Track challenge progress with daily logging
- [ ] Complete challenge → earn XP + badge

#### 3.2 — Pack Challenges (Weeks 15–16)
- [ ] Pack admin can launch a Pack Challenge
- [ ] Shared collective goal (e.g. combined 50 workouts in 2 weeks)
- [ ] Progress bar on Pack page showing collective completion
- [ ] All members rewarded on completion

#### 3.3 — Pack vs. Pack Battles (Week 17)
- [ ] Challenge another Pack to a weekly XP battle
- [ ] Winning Pack earns a trophy icon and bonus XP for all members
- [ ] Battle history visible on Pack page

#### 3.4 — Monthly Community Events (Week 18)
- [ ] App-wide challenge (e.g. "30-Day Clean Eating Challenge — April")
- [ ] Anyone can join regardless of Pack
- [ ] Global progress tracker (total community workouts / meals logged)
- [ ] Top 10 individual performers featured on community page

### Deliverables
- Challenge system fully live
- First app-wide community event launched

---

## ✨ Phase 4 — Growth & Polish
**Timeline: Weeks 19–24**

Refine UX, add retention mechanics, and prepare for public launch.

### Goals
- Smooth, delightful mobile-first UI
- Push notifications driving daily habit return
- Sharing features to drive organic growth

### Features

#### 4.1 — Push Notifications (Week 19)
- [ ] Integrate Novu for multi-channel notifications
- [ ] Daily check-in reminder (user-set time)
- [ ] "Your Pack is waiting 👀" nudge after 6 hours without check-in
- [ ] Streak at risk warning: "⚠️ Check in before midnight to keep your 🔥 14-day streak"
- [ ] Badge unlocked, level-up, challenge completed notifications
- [ ] Weekly summary: XP earned, streak, Pack rank, MVP spotlight

#### 4.2 — Progress Photos & Sharing (Week 20)
- [ ] Upload before/after progress photo (private by default)
- [ ] Share to Pack feed (opt-in)
- [ ] Auto-generate weekly recap card (shareable to Instagram/X stories)
- [ ] Recap card includes: streak, XP this week, level, Pack rank

#### 4.3 — Onboarding Improvements (Week 21)
- [ ] Animated onboarding flow (3 screens: goal → find your pack → first check-in)
- [ ] Guided first check-in walkthrough
- [ ] Invite friends flow with shareable Pack link
- [ ] Empty Pack state: suggested public Packs to join

#### 4.4 — Performance & UX Polish (Weeks 22–23)
- [ ] Optimistic UI updates (check-ins feel instant)
- [ ] Skeleton loading states on all pages
- [ ] Mobile-first responsive design audit
- [ ] Accessibility audit (WCAG AA compliance)
- [ ] Error handling and offline-state messaging
- [ ] Performance audit (Core Web Vitals — LCP, CLS, FID)

#### 4.5 — Analytics & Admin Dashboard (Week 24)
- [ ] Basic analytics: DAU, WAU, check-in rate, streak distribution
- [ ] Admin panel: manage users, Packs, reported content
- [ ] Content moderation: report feature on posts/comments
- [ ] App health monitoring (Sentry for errors, uptime alerts)

### Deliverables
- Public launch-ready product
- Launch on Product Hunt + social channels

---

## 🌍 Phase 5 — Scale & Expand
**Timeline: Month 7+**

Grow the platform and expand beyond fitness into a broader accountability ecosystem.

### Potential Features (Backlog)
- [ ] **Nutrition tracking v2** — macro/calorie logging, meal library, recipe feed
- [ ] **Workout plans** — structured programs (Beginner, Intermediate, Advanced)
- [ ] **Coach/Mentor role** — verified fitness coaches can run public Packs
- [ ] **Mental wellness goals** — sleep, meditation, journaling check-ins
- [ ] **Goal categories beyond fitness** — study habits, financial goals, sobriety
- [ ] **Native mobile apps** — iOS and Android (React Native)
- [ ] **Premium tier** — advanced analytics, unlimited freezes, private Pack creation
- [ ] **Partnerships** — gyms, health food brands, fitness influencers

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Animations | Framer Motion |
| Auth | Clerk |
| Database | PostgreSQL + Prisma ORM |
| Cache / Leaderboards | Redis (Upstash) |
| Real-time Feed | Pusher or Supabase Realtime |
| Media Storage | Cloudinary |
| Notifications | Novu |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway or Render |

---

## 🗄️ Database Schema (v1 Overview)

```
Users          → id, name, avatar, goal, level, xp, streak, streak_freezes
Packs          → id, name, goal_type, invite_code, admin_user_id
PackMembers    → pack_id, user_id, joined_at, role
CheckIns       → id, user_id, date, workout_done, meal_type, rest_day, xp_earned
XPEvents       → id, user_id, action_type, xp, created_at
Badges         → id, user_id, badge_key, earned_at
Challenges     → id, type, title, pack_id (nullable), end_date, goal_metric
Reactions      → id, user_id, check_in_id, reaction_type
Comments       → id, user_id, check_in_id, content, created_at
```

---

## 📊 Success Metrics

| Metric | Target (End of Phase 1) | Target (End of Phase 4) |
|---|---|---|
| Registered users | 50 | 1,000+ |
| Daily Active Users | 20 | 300+ |
| Daily check-in rate | 60% | 70%+ |
| Average streak length | 4 days | 10+ days |
| Pack retention (30-day) | — | 50%+ |

---

## 🚨 Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Low daily retention | Strong streak + notification system; social obligation within Packs |
| Pack goes inactive | "Pack health" indicator; admin nudge if no check-ins for 3 days |
| Toxic comparison / shaming | Positive-only reactions; report feature; no negative feedback mechanics |
| Scope creep | Strict phase gates — don't start Phase 2 until Phase 1 is validated |
| Cold start (empty Packs) | Seed with a few public "open" Packs anyone can join at launch |

---

*Last updated: April 2026 — v1.0*
