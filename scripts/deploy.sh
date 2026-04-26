#!/bin/bash
# ══════════════════════════════════════════════════════════════
# PeakPack — Deployment Script
# Run on the VPS: /opt/peakpack/scripts/deploy.sh
# ══════════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR="/opt/peakpack"
COMPOSE="docker compose"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PeakPack Deploy — $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$APP_DIR"

# ── 1. Pull latest code ───────────────────────────────────────
echo "[1/7] Pulling latest code from main..."
git pull origin main

# ── 2. Build new images ───────────────────────────────────────
echo "[2/7] Building Docker images..."
$COMPOSE build --no-cache frontend api

# ── 3. Run DB migrations ──────────────────────────────────────
echo "[3/7] Running database migrations..."
$COMPOSE run --rm api npx prisma migrate deploy
echo "      ✓ Migrations complete"

# ── 4. Rolling update: API + Worker first ─────────────────────
echo "[4/7] Deploying API and worker..."
$COMPOSE up -d --no-deps api worker

# ── 5. Health check API ───────────────────────────────────────
echo "[5/7] Waiting for API health check..."
RETRIES=12
for i in $(seq 1 $RETRIES); do
  if curl -sf http://localhost:4000/api/health > /dev/null; then
    echo "      ✓ API is healthy"
    break
  fi
  if [ "$i" -eq "$RETRIES" ]; then
    echo "      ✗ API failed health check after ${RETRIES} attempts. Rolling back..."
    git stash
    $COMPOSE up -d --no-deps api worker
    exit 1
  fi
  echo "      Attempt $i/$RETRIES — retrying in 5s..."
  sleep 5
done

# ── 6. Deploy frontend ────────────────────────────────────────
echo "[6/7] Deploying frontend..."
$COMPOSE up -d --no-deps frontend

# ── 7. Cleanup old images ─────────────────────────────────────
echo "[7/7] Pruning old Docker images..."
docker image prune -f

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Deploy complete — $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
