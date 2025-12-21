import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { logger } from '../utils/logger';
import { config } from '../utils/env';

const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;
const THUMBNAIL_QUALITY = 80;

/**
 * Generate thumbnail for an image
 */
export const generateThumbnail = async (filePath: string): Promise<string> => {
  try {
    const uploadDir = path.resolve(config.upload.dir);
    const fileDir = path.dirname(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    const ext = path.extname(filePath);
    
    // Get relative path from uploads directory
    const relativePath = path.relative(path.join(uploadDir, 'photos'), fileDir);
    
    // Create thumbnail path: uploads/thumbnails/YYYY/MM/DD/filename_thumb.jpg
    // This matches the photo directory structure
    const thumbnailDir = path.join(uploadDir, 'thumbnails', relativePath);
    const thumbnailPath = path.join(thumbnailDir, `${fileName}_thumb.jpg`);

    // Ensure thumbnail directory exists
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    await sharp(filePath)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: THUMBNAIL_QUALITY })
      .toFile(thumbnailPath);

    logger.debug(`Generated thumbnail: ${thumbnailPath}`);
    return thumbnailPath;
  } catch (error) {
    logger.error('Error generating thumbnail:', error);
    throw error;
  }
};

/**
 * Save photo to database
 */
export const savePhotoToDatabase = async (
  entryId: string,
  filename: string,
  filePath: string,
  fileSize: number,
  mimeType: string,
  thumbnailPath: string
): Promise<string> => {
  try {
    const result = await pool.query(
      `INSERT INTO photos (entry_id, filename, file_path, file_size, mime_type, thumbnail_path)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [entryId, filename, filePath, fileSize, mimeType, thumbnailPath]
    );

    return result.rows[0].id;
  } catch (error) {
    logger.error('Error saving photo to database:', error);
    throw error;
  }
};

/**
 * Get photo by ID
 */
export const getPhotoById = async (photoId: string) => {
  try {
    const result = await pool.query('SELECT * FROM photos WHERE id = $1', [photoId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    logger.error('Error getting photo:', error);
    throw error;
  }
};

/**
 * Delete photo from database and filesystem
 */
export const deletePhoto = async (photoId: string): Promise<void> => {
  try {
    // Get photo info
    const photo = await getPhotoById(photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }

    // Delete from database
    await pool.query('DELETE FROM photos WHERE id = $1', [photoId]);

    // Delete files
    if (fs.existsSync(photo.file_path)) {
      fs.unlinkSync(photo.file_path);
    }
    if (photo.thumbnail_path && fs.existsSync(photo.thumbnail_path)) {
      fs.unlinkSync(photo.thumbnail_path);
    }

    logger.info(`Photo deleted: ${photoId}`);
  } catch (error) {
    logger.error('Error deleting photo:', error);
    throw error;
  }
};

/**
 * Get photos for an entry
 */
export const getPhotosByEntryId = async (entryId: string) => {
  try {
    const result = await pool.query('SELECT * FROM photos WHERE entry_id = $1 ORDER BY uploaded_at ASC', [entryId]);
    return result.rows;
  } catch (error) {
    logger.error('Error getting photos by entry ID:', error);
    throw error;
  }
};

/**
 * Get relative path from uploads directory
 */
export const getRelativePath = (absolutePath: string): string => {
  const uploadDir = path.resolve(config.upload.dir);
  return path.relative(uploadDir, absolutePath);
};

/**
 * Get absolute path from relative path
 */
export const getAbsolutePath = (relativePath: string): string => {
  const uploadDir = path.resolve(config.upload.dir);
  return path.resolve(uploadDir, relativePath);
};





