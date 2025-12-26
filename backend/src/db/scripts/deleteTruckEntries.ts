/**
 * Script to delete all entries (trucks, vehicles, and visitors) from the database
 * 
 * This script:
 * 1. Shows statistics about all entries before deletion
 * 2. Deletes all entries (photos will cascade delete automatically)
 * 3. Optionally deletes photo files from disk
 * 
 * NOTE: This will NOT delete users or any other database tables
 * 
 * Usage:
 *   npx ts-node backend/src/db/scripts/deleteTruckEntries.ts [--delete-files]
 * 
 *   Or use the SQL script:
 *   psql $DATABASE_URL -f backend/src/db/scripts/delete_truck_entries.sql
 * 
 * WARNING: This action cannot be undone. Make sure you have a backup!
 */

import pool from '../../config/database';
import { logger } from '../../utils/logger';
import * as photoService from '../../services/photoService';
import fs from 'fs';
import path from 'path';
import { config } from '../../utils/env';

const DELETE_FILES = process.argv.includes('--delete-files');

async function deleteAllEntries() {
  try {
    logger.info('Starting entries deletion (trucks, vehicles, and visitors)...');

    // Get statistics before deletion by entry type
    const statsByTypeResult = await pool.query(`
      SELECT 
        entry_type,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'exited' THEN 1 END) as exited,
        COUNT(CASE WHEN status = 'emergency_exit' THEN 1 END) as emergency_exit
      FROM entries 
      GROUP BY entry_type
      ORDER BY entry_type
    `);

    const totalResult = await pool.query(`SELECT COUNT(*) as total FROM entries`);
    const totalEntries = parseInt(totalResult.rows[0].total);

    logger.info(`Found ${totalEntries} total entries:`);
    statsByTypeResult.rows.forEach((row: any) => {
      logger.info(`  ${row.entry_type}: ${row.total} (Active: ${row.active}, Exited: ${row.exited}, Emergency: ${row.emergency_exit})`);
    });

    if (totalEntries === 0) {
      logger.info('No entries found. Nothing to delete.');
      process.exit(0);
    }

    // Get all entry IDs and their photo IDs before deletion
    const entriesResult = await pool.query(`
      SELECT 
        e.id as entry_id,
        e.entry_type,
        e.photos as photo_ids
      FROM entries e
    `);

    const entryIds = entriesResult.rows.map((row: any) => row.entry_id);
    const allPhotoIds: string[] = [];

    entriesResult.rows.forEach((row: any) => {
      if (row.photo_ids) {
        const photoIds = typeof row.photo_ids === 'string' 
          ? JSON.parse(row.photo_ids) 
          : row.photo_ids;
        if (Array.isArray(photoIds)) {
          allPhotoIds.push(...photoIds);
        }
      }
    });

    logger.info(`Found ${allPhotoIds.length} photo IDs associated with entries`);

    // If we need to delete files, get photo file paths first
    let photoFilesToDelete: Array<{ file_path: string; thumbnail_path: string | null }> = [];
    if (DELETE_FILES && allPhotoIds.length > 0) {
      const photosResult = await pool.query(`
        SELECT file_path, thumbnail_path 
        FROM photos 
        WHERE id = ANY($1::uuid[])
      `, [allPhotoIds]);

      photoFilesToDelete = photosResult.rows;
      logger.info(`Found ${photoFilesToDelete.length} photo files to delete from disk`);
    }

    // Delete all entries (photos will cascade delete from database)
    const deleteResult = await pool.query(`
      DELETE FROM entries 
      RETURNING id, entry_type
    `);

    // Count by type
    const deletedByType: Record<string, number> = {};
    deleteResult.rows.forEach((row: any) => {
      deletedByType[row.entry_type] = (deletedByType[row.entry_type] || 0) + 1;
    });

    logger.info(`Successfully deleted ${deleteResult.rows.length} entries from database:`);
    Object.entries(deletedByType).forEach(([type, count]) => {
      logger.info(`  - ${type}: ${count}`);
    });

    // Delete photo files from disk if requested
    if (DELETE_FILES && photoFilesToDelete.length > 0) {
      let deletedCount = 0;
      let errorCount = 0;

      for (const photo of photoFilesToDelete) {
        try {
          // Delete main photo file
          if (photo.file_path) {
            const absolutePath = photoService.getAbsolutePath(photo.file_path);
            if (fs.existsSync(absolutePath)) {
              fs.unlinkSync(absolutePath);
              deletedCount++;
            }
          }

          // Delete thumbnail file
          if (photo.thumbnail_path) {
            const absoluteThumbPath = photoService.getAbsolutePath(photo.thumbnail_path);
            if (fs.existsSync(absoluteThumbPath)) {
              fs.unlinkSync(absoluteThumbPath);
              deletedCount++;
            }
          }
        } catch (error: any) {
          logger.error(`Error deleting photo file ${photo.file_path}:`, error.message);
          errorCount++;
        }
      }

      logger.info(`Deleted ${deletedCount} photo files from disk`);
      if (errorCount > 0) {
        logger.warn(`Failed to delete ${errorCount} photo files`);
      }
    }

    // Verify deletion
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as remaining 
      FROM entries
    `);

    const remaining = parseInt(verifyResult.rows[0].remaining);
    if (remaining === 0) {
      logger.info('✅ All entries have been successfully deleted');
    } else {
      logger.warn(`⚠️  Warning: ${remaining} entries still remain`);
    }

    logger.info('Entries deletion completed');
    process.exit(0);
  } catch (error: any) {
    logger.error('Error deleting entries:', error);
    process.exit(1);
  }
}

// Run the script
deleteAllEntries();

