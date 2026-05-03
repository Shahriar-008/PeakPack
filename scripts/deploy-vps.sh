#!/bin/bash
# ══════════════════════════════════════════════════════════════
# PeakPack — VPS Deployment Script
# 
# Usage: ./deploy-vps.sh [app-dir]
#   app-dir  — path to repo on VPS (default: /opt/peakpack)
#
# This script:
#   1. Pulls latest code from main
#   2. Builds Docker images (frontend, api, worker)
#   3. Runs database migrations
#   4. Deploys services via docker-compose up
#   5. Validates health checks
# ══════════════════════════════════════════════════════════════
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
APP_DIR="${1:-/opt/peakpack}"
COMPOSE_FILE="docker-compose.vps.yml"
HEALTHCHECK_RETRIES=12
HEALTHCHECK_INTERVAL=5
LOG_FILE="${APP_DIR}/deploy.log"

# ── Helper functions ───────────────────────────────────────────
log() {
  local level="$1"
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

error_exit() {
  log "ERROR" "$1"
  exit 1
}

# ── Validation ─────────────────────────────────────────────────
if [ ! -d "$APP_DIR" ]; then
  error_exit "App directory not found: $APP_DIR"
fi

if [ ! -f "$APP_DIR/$COMPOSE_FILE" ]; then
  error_exit "Compose file not found: $APP_DIR/$COMPOSE_FILE"
fi

# ══════════════════════════════════════════════════════════════
# Deployment Workflow
# ══════════════════════════════════════════════════════════════

log "INFO" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "INFO" "PeakPack VPS Deploy — $(date '+%Y-%m-%d %H:%M:%S')"
log "INFO" "App directory: $APP_DIR"
log "INFO" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$APP_DIR" || error_exit "Failed to cd to $APP_DIR"

# ── 1. Pull latest code ────────────────────────────────────────
log "INFO" "[1/7] Pulling latest code from main..."
if ! git fetch origin main; then
  error_exit "Failed to fetch from origin/main"
fi

# Safety check: ensure we're on main before pulling
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  log "WARN" "Current branch is '$CURRENT_BRANCH', not 'main'. Checking out main..."
  git checkout main || error_exit "Failed to checkout main"
fi

if ! git reset --hard origin/main; then
  error_exit "Failed to reset to origin/main"
fi
log "INFO" "      ✓ Code pulled successfully"

# ── 2. Build Docker images ────────────────────────────────────
log "INFO" "[2/7] Building Docker images..."
if ! docker compose -f "$COMPOSE_FILE" build --no-cache frontend api worker; then
  error_exit "Docker build failed"
fi
log "INFO" "      ✓ Images built successfully"

# ── 3. Run database migrations ─────────────────────────────────
log "INFO" "[3/7] Running database migrations..."
if ! docker compose -f "$COMPOSE_FILE" run --rm api npx prisma migrate deploy; then
  error_exit "Database migrations failed"
fi
log "INFO" "      ✓ Migrations complete"

# ── 4. Deploy services ────────────────────────────────────────
log "INFO" "[4/7] Deploying services..."
if ! docker compose -f "$COMPOSE_FILE" up -d --build; then
  error_exit "Docker compose up failed"
fi
log "INFO" "      ✓ Services deployed"

# ── 5. Health check: API ──────────────────────────────────────
log "INFO" "[5/7] Waiting for API health check..."
RETRIES=0
API_HEALTHY=false
while [ $RETRIES -lt $HEALTHCHECK_RETRIES ]; do
  if curl -sf http://localhost:4000/api/healthz > /dev/null 2>&1; then
    log "INFO" "      ✓ API is healthy"
    API_HEALTHY=true
    break
  fi
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -lt $HEALTHCHECK_RETRIES ]; then
    log "INFO" "      Attempt $RETRIES/$HEALTHCHECK_RETRIES — retrying in ${HEALTHCHECK_INTERVAL}s..."
    sleep $HEALTHCHECK_INTERVAL
  fi
done

if [ "$API_HEALTHY" = false ]; then
  log "ERROR" "API failed health check after $HEALTHCHECK_RETRIES attempts"
  log "WARN" "Rolling back deployment..."
  git reset --hard HEAD~1
  docker compose -f "$COMPOSE_FILE" down
  if ! docker compose -f "$COMPOSE_FILE" up -d; then
    log "ERROR" "Rollback deployment also failed. Manual intervention required."
  fi
  error_exit "Deployment failed and rolled back"
fi

# ── 6. Health check: Frontend ─────────────────────────────────
log "INFO" "[6/7] Waiting for Frontend health check..."
RETRIES=0
FRONTEND_HEALTHY=false
while [ $RETRIES -lt $HEALTHCHECK_RETRIES ]; do
  if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    log "INFO" "      ✓ Frontend is healthy"
    FRONTEND_HEALTHY=true
    break
  fi
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -lt $HEALTHCHECK_RETRIES ]; then
    log "INFO" "      Attempt $RETRIES/$HEALTHCHECK_RETRIES — retrying in ${HEALTHCHECK_INTERVAL}s..."
    sleep $HEALTHCHECK_INTERVAL
  fi
done

if [ "$FRONTEND_HEALTHY" = false ]; then
  log "WARN" "Frontend health check failed (this may be non-critical if API is healthy)"
fi

# ── 7. Cleanup old images ──────────────────────────────────────
log "INFO" "[7/7] Cleaning up old Docker images..."
docker image prune -af --filter "until=24h" || true
log "INFO" "      ✓ Cleanup complete"

log "INFO" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "INFO" "✓ Deploy complete — $(date '+%Y-%m-%d %H:%M:%S')"
log "INFO" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "INFO" "Log file: $LOG_FILE"

exit 0
