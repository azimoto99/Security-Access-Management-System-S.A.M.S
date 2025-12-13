import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import * as photoService from '../services/photoService';
import pool from '../config/database';

/**
 * Upload photo(s) for an entry
 */
export const uploadPhotos = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    const { entry_id } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!entry_id) {
      const error: AppError = new Error('entry_id is required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    if (!files || files.length === 0) {
      const error: AppError = new Error('No files uploaded');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Verify entry exists
    const entryResult = await pool.query('SELECT id FROM entries WHERE id = $1', [entry_id]);
    if (entryResult.rows.length === 0) {
      const error: AppError = new Error('Entry not found');
      error.statusCode = 404;
      error.code = 'ENTRY_NOT_FOUND';
      return next(error);
    }

    // Process each file
    const uploadedPhotos = [];
    const errors = [];

    for (const file of files) {
      try {
        // Generate thumbnail
        const thumbnailPath = await photoService.generateThumbnail(file.path);

        // Save to database
        const photoId = await photoService.savePhotoToDatabase(
          entry_id,
          file.originalname,
          photoService.getRelativePath(file.path),
          file.size,
          file.mimetype,
          photoService.getRelativePath(thumbnailPath)
        );

        // Update entry photos array
        const entryResult = await pool.query('SELECT photos FROM entries WHERE id = $1', [entry_id]);
        const currentPhotos = entryResult.rows[0].photos || [];
        await pool.query('UPDATE entries SET photos = $1 WHERE id = $2', [
          JSON.stringify([...currentPhotos, photoId]),
          entry_id,
        ]);

        uploadedPhotos.push({
          id: photoId,
          filename: file.originalname,
          size: file.size,
          mime_type: file.mimetype,
        });
      } catch (error: any) {
        logger.error(`Error processing file ${file.originalname}:`, error);
        errors.push({ filename: file.originalname, error: error.message });
      }
    }

    // Log action
    if (req.user) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          'upload_photos',
          'entry',
          entry_id,
          JSON.stringify({
            photo_count: uploadedPhotos.length,
            uploaded_by: req.user.username,
          }),
        ]
      );
    }

    logger.info(`${uploadedPhotos.length} photo(s) uploaded for entry ${entry_id} by ${req.user?.username}`);

    res.status(201).json({
      success: true,
      data: {
        photos: uploadedPhotos,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get photo by ID
 */
export const getPhoto = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { thumbnail } = req.query;

    const photo = await photoService.getPhotoById(id);
    if (!photo) {
      const error: AppError = new Error('Photo not found');
      error.statusCode = 404;
      error.code = 'PHOTO_NOT_FOUND';
      return next(error);
    }

    const filePath = thumbnail === 'true' && photo.thumbnail_path
      ? photoService.getAbsolutePath(photo.thumbnail_path)
      : photoService.getAbsolutePath(photo.file_path);

    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      const error: AppError = new Error('Photo file not found');
      error.statusCode = 404;
      error.code = 'PHOTO_FILE_NOT_FOUND';
      return next(error);
    }

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

/**
 * Get photos for an entry
 */
export const getEntryPhotos = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { entryId } = req.params;

    const photos = await photoService.getPhotosByEntryId(entryId);

    res.json({
      success: true,
      data: {
        photos,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete photo
 */
export const deletePhoto = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    const { id } = req.params;

    const photo = await photoService.getPhotoById(id);
    if (!photo) {
      const error: AppError = new Error('Photo not found');
      error.statusCode = 404;
      error.code = 'PHOTO_NOT_FOUND';
      return next(error);
    }

    // Remove photo ID from entry photos array
    const entryResult = await pool.query('SELECT photos FROM entries WHERE id = $1', [photo.entry_id]);
    const currentPhotos = entryResult.rows[0].photos || [];
    const updatedPhotos = currentPhotos.filter((pid: string) => pid !== id);
    await pool.query('UPDATE entries SET photos = $1 WHERE id = $2', [
      JSON.stringify(updatedPhotos),
      photo.entry_id,
    ]);

    // Delete photo
    await photoService.deletePhoto(id);

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'delete_photo',
        'photo',
        id,
        JSON.stringify({ entry_id: photo.entry_id, deleted_by: req.user.username }),
      ]
    );

    logger.info(`Photo deleted: ${id} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};





