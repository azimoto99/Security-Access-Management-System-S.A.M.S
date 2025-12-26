#!/bin/bash

# Backup script for Security Access Management System
# Usage: ./scripts/backup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Starting backup process..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Database backup
echo "🗄️  Backing up database..."
docker-compose exec -T postgres pg_dump -U postgres security_access_db > "$BACKUP_DIR/db_backup_$DATE.sql" || {
    echo "⚠️  Database backup failed. Is the database container running?"
}

# File uploads backup
echo "📁 Backing up file uploads..."
if [ -d "$PROJECT_ROOT/backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" -C "$PROJECT_ROOT/backend" uploads || {
        echo "⚠️  File uploads backup failed"
    }
else
    echo "⚠️  Uploads directory not found"
fi

# Compress database backup
if [ -f "$BACKUP_DIR/db_backup_$DATE.sql" ]; then
    gzip "$BACKUP_DIR/db_backup_$DATE.sql"
    echo "✅ Database backup created: db_backup_$DATE.sql.gz"
fi

# Cleanup old backups (keep last 30 days)
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "✅ Backup completed successfully!"
echo "📦 Backup location: $BACKUP_DIR"













