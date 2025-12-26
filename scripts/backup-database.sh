#!/bin/bash

# Automated Database Backup Script for Render
# This script can be run as a Render Cron Job
# 
# Setup in Render:
# 1. Go to your backend service
# 2. Add a Cron Job
# 3. Schedule: 0 2 * * * (daily at 2 AM UTC)
# 4. Command: /app/scripts/backup-database.sh
# 5. Set environment variables: DATABASE_URL, BACKUP_RETENTION_DAYS (optional, default 30)

set -e

# Configuration
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
BACKUP_DIR="${BACKUP_DIR:-/var/data/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "💾 Starting database backup..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract database name from DATABASE_URL for filename
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
if [ -z "$DB_NAME" ]; then
    DB_NAME="database"
fi

BACKUP_FILE="$BACKUP_DIR/db_backup_${DB_NAME}_${DATE}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

# Perform backup
log "📦 Backing up database: $DB_NAME"
if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
    log "✅ Database backup created: $BACKUP_FILE"
    
    # Compress backup
    log "🗜️  Compressing backup..."
    gzip "$BACKUP_FILE"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
    log "✅ Backup compressed: $BACKUP_FILE_GZ ($BACKUP_SIZE)"
    
    # Cleanup old backups
    log "🧹 Cleaning up backups older than $BACKUP_RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f -mtime +$BACKUP_RETENTION_DAYS -delete
    RETAINED=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f | wc -l)
    log "📊 Retained $RETAINED backup(s)"
    
    log "✅ Backup completed successfully!"
    exit 0
else
    log "❌ ERROR: Database backup failed"
    exit 1
fi

