import { Response, NextFunction } from 'express';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { config } from '../utils/env';
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

    logger.debug(`Photo request: id=${id}, thumbnail=${thumbnail}, origin=${req.headers.origin}`);

    const photo = await photoService.getPhotoById(id);
    if (!photo) {
      logger.warn(`Photo not found: ${id}`);
      const error: AppError = new Error('Photo not found');
      error.statusCode = 404;
      error.code = 'PHOTO_NOT_FOUND';
      return next(error);
    }

    const filePath = thumbnail === 'true' && photo.thumbnail_path
      ? photoService.getAbsolutePath(photo.thumbnail_path)
      : photoService.getAbsolutePath(photo.file_path);

    logger.debug(`Photo file path: ${filePath}`);

    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      logger.error(`Photo file not found on disk: ${filePath}`);
      const error: AppError = new Error('Photo file not found');
      error.statusCode = 404;
      error.code = 'PHOTO_FILE_NOT_FOUND';
      return next(error);
    }

    // Set CORS headers explicitly for file responses
    // For photo requests, always set CORS headers to allow cross-origin access
    const allowedOrigin = config.cors.origin;
    const requestOrigin = req.headers.origin;
    
    logger.debug(`CORS: allowedOrigin=${allowedOrigin}, requestOrigin=${requestOrigin}`);
    
    // Always set CORS headers for photo requests
    // Use the configured origin or request origin, prioritizing configured origin
    let corsOrigin: string | undefined;
    
    if (allowedOrigin === '*') {
      corsOrigin = '*';
    } else if (allowedOrigin) {
      if (allowedOrigin.includes(',')) {
        // Multiple origins - try to match request origin, otherwise use first
        const origins = allowedOrigin.split(',').map((o: string) => o.trim());
        if (requestOrigin && origins.includes(requestOrigin)) {
          corsOrigin = requestOrigin;
        } else {
          corsOrigin = origins[0];
        }
      } else {
        // Single origin configured - always use it for photo requests
        corsOrigin = allowedOrigin;
      }
    } else if (requestOrigin) {
      corsOrigin = requestOrigin;
    }
    
    // Always set CORS headers if we have an origin
    if (corsOrigin) {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    }
    
    res.setHeader('Content-Type', photo.mime_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Ensure filePath is absolute
    const absoluteFilePath = path.resolve(filePath);
    logger.debug(`Sending photo file: ${absoluteFilePath}`);
    res.sendFile(absoluteFilePath);
  } catch (error) {
    logger.error('Error serving photo:', error);
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
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    const { entryId } = req.params;

    // Verify entry exists and check job site access for guards
    const entryResult = await pool.query(
      'SELECT id, job_site_id FROM entries WHERE id = $1',
      [entryId]
    );
    
    if (entryResult.rows.length === 0) {
      const error: AppError = new Error('Entry not found');
      error.statusCode = 404;
      error.code = 'ENTRY_NOT_FOUND';
      return next(error);
    }

    const entry = entryResult.rows[0];

    // Check job site access if not admin
    if (req.user.role !== 'admin') {
      const jobSiteAccess = req.user.job_site_access || [];
      if (!jobSiteAccess.includes(entry.job_site_id)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
    }

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





