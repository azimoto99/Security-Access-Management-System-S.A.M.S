#!/usr/bin/env node

/**
 * Automated Database Backup Script for Render
 * 
 * This script can be run as a Render Cron Job or scheduled task
 * 
 * Setup in Render:
 * 1. Go to your backend service
 * 2. Add a Cron Job
 * 3. Schedule: 0 2 * * * (daily at 2 AM UTC)
 * 4. Command: node scripts/backup-database.js
 * 5. Set environment variables: DATABASE_URL, BACKUP_RETENTION_DAYS (optional, default 30)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
const BACKUP_DIR = process.env.BACKUP_DIR || process.env.RENDER_DISK_PATH 
  ? `${process.env.RENDER_DISK_PATH}/backups` 
  : './backups';
const DATABASE_URL = process.env.DATABASE_URL;

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log(`Created backup directory: ${BACKUP_DIR}`);
  }
}

function getBackupFilename() {
  const date = new Date();
  const dateStr = date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const dbName = DATABASE_URL.match(/\/([^/?]+)(\?|$)/)?.[1] || 'database';
  return `db_backup_${dbName}_${dateStr}.sql.gz`;
}

function performBackup() {
  ensureBackupDir();
  
  if (!DATABASE_URL) {
    log('❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const backupFile = path.join(BACKUP_DIR, getBackupFilename());
  const tempFile = backupFile.replace('.gz', '');

  try {
    log('💾 Starting database backup...');
    
    // Run pg_dump
    log('📦 Backing up database...');
    execSync(`pg_dump "${DATABASE_URL}" > "${tempFile}"`, { stdio: 'inherit' });
    
    // Compress backup
    log('🗜️  Compressing backup...');
    execSync(`gzip "${tempFile}"`, { stdio: 'inherit' });
    
    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    log(`✅ Backup created: ${backupFile} (${sizeMB} MB)`);
    
    // Cleanup old backups
    log(`🧹 Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days...`);
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('db_backup_') && f.endsWith('.sql.gz'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);

    let deletedCount = 0;
    files.forEach(file => {
      if (file.mtime < cutoffDate) {
        fs.unlinkSync(file.path);
        deletedCount++;
        log(`🗑️  Deleted old backup: ${file.name}`);
      }
    });

    const retained = files.length - deletedCount;
    log(`📊 Retained ${retained} backup(s)`);
    log('✅ Backup completed successfully!');
    
    process.exit(0);
  } catch (error) {
    log(`❌ ERROR: Backup failed: ${error.message}`);
    // Clean up temp file if it exists
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    process.exit(1);
  }
}

performBackup();

