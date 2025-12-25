import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import * as hrDocumentService from '../services/hrDocumentService';
import { config } from '../utils/env';

/**
 * Get all HR documents
 */
export const getAllHRDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { active_only } = req.query;
    const documents = await hrDocumentService.getAllHRDocuments(active_only === 'true');
    res.json({
      success: true,
      data: {
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get HR document by ID
 */
export const getHRDocumentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const document = await hrDocumentService.getHRDocumentById(id);

    if (!document) {
      const error: AppError = new Error('HR document not found');
      error.statusCode = 404;
      error.code = 'HR_DOCUMENT_NOT_FOUND';
      return next(error);
    }

    res.json({
      success: true,
      data: {
        document,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create HR document
 */
export const createHRDocument = async (
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

    const file = req.file;
    if (!file) {
      const error: AppError = new Error('Document file is required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const { title, description, document_type, is_required } = req.body;

    if (!title || !document_type) {
      const error: AppError = new Error('Title and document_type are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Get relative path from uploads directory
    const relativePath = path.relative(config.upload.dir, file.path);

    const document = await hrDocumentService.createHRDocument(req.user.id, {
      title,
      description,
      document_type: document_type as 'onboarding' | 'policy' | 'contract' | 'other',
      file_path: relativePath,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      is_required: is_required === 'true' || is_required === true,
    });

    res.status(201).json({
      success: true,
      data: {
        document,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update HR document
 */
export const updateHRDocument = async (
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
    const { title, description, document_type, is_required, is_active } = req.body;

    const document = await hrDocumentService.updateHRDocument(id, req.user.id, {
      title,
      description,
      document_type: document_type as 'onboarding' | 'policy' | 'contract' | 'other' | undefined,
      is_required: is_required !== undefined ? is_required === 'true' || is_required === true : undefined,
      is_active: is_active !== undefined ? is_active === 'true' || is_active === true : undefined,
    });

    res.json({
      success: true,
      data: {
        document,
      },
    });
  } catch (error: any) {
    if (error.message === 'HR document not found') {
      const appError: AppError = new Error('HR document not found');
      appError.statusCode = 404;
      appError.code = 'HR_DOCUMENT_NOT_FOUND';
      return next(appError);
    }
    next(error);
  }
};

/**
 * Delete HR document
 */
export const deleteHRDocument = async (
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
    await hrDocumentService.deleteHRDocument(id, req.user.id);

    res.json({
      success: true,
      message: 'HR document deleted successfully',
    });
  } catch (error: any) {
    if (error.message === 'HR document not found') {
      const appError: AppError = new Error('HR document not found');
      appError.statusCode = 404;
      appError.code = 'HR_DOCUMENT_NOT_FOUND';
      return next(appError);
    }
    next(error);
  }
};

/**
 * Download HR document
 */
export const downloadHRDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const filePath = await hrDocumentService.getDocumentFilePath(id);

    if (!filePath) {
      const error: AppError = new Error('HR document not found');
      error.statusCode = 404;
      error.code = 'HR_DOCUMENT_NOT_FOUND';
      return next(error);
    }

    const fullPath = path.join(config.upload.dir, filePath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      const error: AppError = new Error('Document file not found');
      error.statusCode = 404;
      error.code = 'FILE_NOT_FOUND';
      return next(error);
    }

    // Get document info for filename
    const document = await hrDocumentService.getHRDocumentById(id);
    const fileName = document?.file_name || 'document';

    res.download(fullPath, fileName);
  } catch (error) {
    next(error);
  }
};











