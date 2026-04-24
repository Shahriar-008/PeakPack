-- Create enums
CREATE TYPE "GoalType" AS ENUM ('WEIGHT_LOSS', 'MUSCLE_GAIN', 'ENDURANCE', 'CLEAN_EATING', 'CUSTOM');
CREATE TYPE "PackRole" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE "MealType" AS ENUM ('CLEAN', 'CHEAT', 'SKIP');
CREATE TYPE "ChallengeType" AS ENUM ('FITNESS', 'DIET', 'PACK', 'COMMUNITY');
CREATE TYPE "ReactionType" AS ENUM ('FIRE', 'STRONG', 'LETS_GO');

-- Create tables
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "clerkUserId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "bio" TEXT,
  "location" TEXT,
  "goalType" "GoalType",
  "goalTarget" TEXT,
  "goalTimeframe" TEXT,
  "level" INTEGER NOT NULL DEFAULT 1,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "streak" INTEGER NOT NULL DEFAULT 0,
  "streakFreezes" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Pack" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "goalType" "GoalType" NOT NULL,
  "description" TEXT,
  "inviteCode" TEXT NOT NULL,
  "minMembers" INTEGER NOT NULL DEFAULT 5,
  "maxMembers" INTEGER NOT NULL DEFAULT 15,
  "adminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PackMember" (
  "packId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "PackRole" NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PackMember_pkey" PRIMARY KEY ("packId", "userId")
);

CREATE TABLE "CheckIn" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "packId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "workoutDone" BOOLEAN NOT NULL,
  "workoutType" TEXT,
  "workoutDurationMinutes" INTEGER,
  "mealType" "MealType" NOT NULL,
  "restDay" BOOLEAN NOT NULL DEFAULT false,
  "xpEarned" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "XPEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "checkInId" TEXT,
  "actionType" TEXT NOT NULL,
  "xp" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "XPEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Badge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "badgeKey" TEXT NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Challenge" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "type" "ChallengeType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "goalMetric" TEXT NOT NULL,
  "packId" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "checkInId" TEXT NOT NULL,
  "reactionType" "ReactionType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Comment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "checkInId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Pack_inviteCode_key" ON "Pack"("inviteCode");
CREATE UNIQUE INDEX "CheckIn_userId_date_key" ON "CheckIn"("userId", "date");
CREATE UNIQUE INDEX "Badge_userId_badgeKey_key" ON "Badge"("userId", "badgeKey");
CREATE UNIQUE INDEX "Reaction_userId_checkInId_key" ON "Reaction"("userId", "checkInId");

-- Indexes
CREATE INDEX "Pack_adminId_idx" ON "Pack"("adminId");
CREATE INDEX "PackMember_userId_idx" ON "PackMember"("userId");
CREATE INDEX "CheckIn_packId_date_idx" ON "CheckIn"("packId", "date");
CREATE INDEX "CheckIn_userId_createdAt_idx" ON "CheckIn"("userId", "createdAt");
CREATE INDEX "XPEvent_userId_createdAt_idx" ON "XPEvent"("userId", "createdAt");
CREATE INDEX "XPEvent_checkInId_idx" ON "XPEvent"("checkInId");
CREATE INDEX "Badge_userId_earnedAt_idx" ON "Badge"("userId", "earnedAt");
CREATE INDEX "Challenge_creatorId_idx" ON "Challenge"("creatorId");
CREATE INDEX "Challenge_packId_idx" ON "Challenge"("packId");
CREATE INDEX "Challenge_endDate_idx" ON "Challenge"("endDate");
CREATE INDEX "Reaction_checkInId_createdAt_idx" ON "Reaction"("checkInId", "createdAt");
CREATE INDEX "Comment_checkInId_createdAt_idx" ON "Comment"("checkInId", "createdAt");
CREATE INDEX "Comment_userId_createdAt_idx" ON "Comment"("userId", "createdAt");

-- Foreign keys
ALTER TABLE "Pack"
  ADD CONSTRAINT "Pack_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PackMember"
  ADD CONSTRAINT "PackMember_packId_fkey"
  FOREIGN KEY ("packId") REFERENCES "Pack"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PackMember"
  ADD CONSTRAINT "PackMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CheckIn"
  ADD CONSTRAINT "CheckIn_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CheckIn"
  ADD CONSTRAINT "CheckIn_packId_fkey"
  FOREIGN KEY ("packId") REFERENCES "Pack"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "XPEvent"
  ADD CONSTRAINT "XPEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "XPEvent"
  ADD CONSTRAINT "XPEvent_checkInId_fkey"
  FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Badge"
  ADD CONSTRAINT "Badge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Challenge"
  ADD CONSTRAINT "Challenge_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Challenge"
  ADD CONSTRAINT "Challenge_packId_fkey"
  FOREIGN KEY ("packId") REFERENCES "Pack"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reaction"
  ADD CONSTRAINT "Reaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reaction"
  ADD CONSTRAINT "Reaction_checkInId_fkey"
  FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_checkInId_fkey"
  FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
