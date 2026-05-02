# ── Stage 1: Dependencies ────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ── Stage 2: Builder ─────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client before compiling TypeScript
RUN npx prisma generate

# Compile TypeScript to dist/
RUN npm run build

# ── Stage 3: Runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl curl
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 expressjs

# Copy compiled output and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Create logs directory with correct ownership for Winston
RUN mkdir -p /app/logs && chown expressjs:nodejs /app/logs

USER expressjs

EXPOSE 4000

# Run migrations on startup, then start the API
# (migrations are safe to run on every deploy if idempotent)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
