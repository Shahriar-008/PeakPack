#!/bin/bash
# ══════════════════════════════════════════════════════════════
# PeakPack — Backup Script
# Crontab: 0 2 * * * /opt/peakpack/scripts/backup.sh >> /var/log/peakpack-backup.log 2>&1
# ══════════════════════════════════════════════════════════════
set -euo pipefail

DATE=$(date +%Y-%m-%d)
APP_DIR="/opt/peakpack"
BACKUP_DIR="/opt/backups/peakpack"
COMPOSE="docker compose"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PeakPack Backup — $DATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$APP_DIR"
mkdir -p "$BACKUP_DIR"

# ── 1. PostgreSQL dump ────────────────────────────────────────
echo "[1/4] Dumping PostgreSQL..."
$COMPOSE exec -T postgres pg_dump -U peakpack peakpack \
  | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"
echo "      ✓ Saved: db_$DATE.sql.gz ($(du -sh "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1))"

# ── 2. Encrypt backup (optional — requires GPG key configured) ─
# echo "[2/4] Encrypting backup..."
# gpg --symmetric --cipher-algo AES256 \
#     --batch --yes \
#     --passphrase-file /opt/peakpack/.backup-passphrase \
#     "$BACKUP_DIR/db_$DATE.sql.gz"
# rm "$BACKUP_DIR/db_$DATE.sql.gz"
# echo "      ✓ Encrypted: db_$DATE.sql.gz.gpg"

# ── 3. Sync MinIO media to local backup ───────────────────────
echo "[3/4] Syncing MinIO media..."
# Requires mc (MinIO Client) installed and configured:
# mc alias set local http://localhost:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
if command -v mc &> /dev/null; then
  mc mirror local/avatars         "$BACKUP_DIR/media/avatars/"        --overwrite
  mc mirror local/progress-photos "$BACKUP_DIR/media/progress-photos/" --overwrite
  echo "      ✓ MinIO media synced"
else
  echo "      ⚠ mc not found — skipping MinIO sync"
fi

# ── 4. Delete backups older than 30 days ─────────────────────
echo "[4/4] Pruning old backups (>30 days)..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.sql.gz.gpg" -mtime +30 -delete
echo "      ✓ Old backups pruned"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Backup complete — $DATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
