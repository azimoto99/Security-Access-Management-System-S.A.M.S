import { Response, NextFunction } from 'express';
import pool from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditLogService';

export interface WatchlistEntry {
  id: string;
  type: 'person' | 'vehicle';
  identifier: string;
  reason: string;
  alert_level: 'low' | 'medium' | 'high';
  created_by: string;
  created_at: Date;
  is_active: boolean;
  created_by_username?: string;
}

/**
 * Get all watchlist entries
 */
export const getAllWatchlistEntries = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { active_only } = req.query;

    let query = `
      SELECT w.*, u.username as created_by_username
      FROM watchlist w
      LEFT JOIN users u ON w.created_by = u.id
    `;

    const values: any[] = [];
    if (active_only === 'true') {
      query += ' WHERE w.is_active = true';
    }

    query += ' ORDER BY w.created_at DESC';

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: {
        entries: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get watchlist entry by ID
 */
export const getWatchlistEntryById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT w.*, u.username as created_by_username
       FROM watchlist w
       LEFT JOIN users u ON w.created_by = u.id
       WHERE w.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      const error: AppError = new Error('Watchlist entry not found');
      error.statusCode = 404;
      error.code = 'WATCHLIST_NOT_FOUND';
      return next(error);
    }

    res.json({
      success: true,
      data: {
        entry: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create watchlist entry
 */
export const createWatchlistEntry = async (
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

    const { type, identifier, reason, alert_level } = req.body;

    // Validate required fields
    if (!type || !identifier || !reason) {
      const error: AppError = new Error('type, identifier, and reason are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Validate type
    if (!['person', 'vehicle'].includes(type)) {
      const error: AppError = new Error('Invalid type. Must be person or vehicle');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Validate alert level
    const validAlertLevels = ['low', 'medium', 'high'];
    const alertLevel = alert_level || 'medium';
    if (!validAlertLevels.includes(alertLevel)) {
      const error: AppError = new Error('Invalid alert level. Must be low, medium, or high');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Check if entry already exists (case-insensitive)
    const existing = await pool.query(
      `SELECT id FROM watchlist
       WHERE type = $1
       AND UPPER(TRIM(identifier)) = UPPER(TRIM($2))
       AND is_active = true`,
      [type, identifier]
    );

    if (existing.rows.length > 0) {
      const error: AppError = new Error('Watchlist entry already exists for this identifier');
      error.statusCode = 400;
      error.code = 'WATCHLIST_EXISTS';
      return next(error);
    }

    // Create entry
    const result = await pool.query(
      `INSERT INTO watchlist (type, identifier, reason, alert_level, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [type, identifier.trim(), reason, alertLevel, req.user.id]
    );

    const entry = result.rows[0];

    // Log action
    await createAuditLog(
      req.user.id,
      'create_watchlist_entry',
      'watchlist',
      entry.id,
      { type, identifier: entry.identifier, alert_level: alertLevel, created_by: req.user.username }
    );

    logger.info(`Watchlist entry created: ${type} - ${entry.identifier} (${entry.id}) by ${req.user.username}`);

    res.status(201).json({
      success: true,
      data: {
        entry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update watchlist entry
 */
export const updateWatchlistEntry = async (
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
    const { identifier, reason, alert_level, is_active } = req.body;

    // Check if entry exists
    const existingResult = await pool.query('SELECT * FROM watchlist WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('Watchlist entry not found');
      error.statusCode = 404;
      error.code = 'WATCHLIST_NOT_FOUND';
      return next(error);
    }

    const existing = existingResult.rows[0];

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (identifier !== undefined && identifier !== existing.identifier) {
      // Check if new identifier already exists
      const identifierCheck = await pool.query(
        `SELECT id FROM watchlist
         WHERE type = $1
         AND UPPER(TRIM(identifier)) = UPPER(TRIM($2))
         AND id != $3
         AND is_active = true`,
        [existing.type, identifier, id]
      );
      if (identifierCheck.rows.length > 0) {
        const error: AppError = new Error('Watchlist entry already exists for this identifier');
        error.statusCode = 400;
        error.code = 'WATCHLIST_EXISTS';
        return next(error);
      }
      updates.push(`identifier = $${paramCount++}`);
      values.push(identifier.trim());
    }

    if (reason !== undefined) {
      updates.push(`reason = $${paramCount++}`);
      values.push(reason);
    }

    if (alert_level !== undefined) {
      if (!['low', 'medium', 'high'].includes(alert_level)) {
        const error: AppError = new Error('Invalid alert level');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }
      updates.push(`alert_level = $${paramCount++}`);
      values.push(alert_level);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      const error: AppError = new Error('No fields to update');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    values.push(id);
    const query = `UPDATE watchlist SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);
    const entry = result.rows[0];

    // Log action
    await createAuditLog(
      req.user.id,
      'update_watchlist_entry',
      'watchlist',
      entry.id,
      { identifier: entry.identifier, updated_by: req.user.username }
    );

    logger.info(`Watchlist entry updated: ${entry.identifier} (${entry.id}) by ${req.user.username}`);

    res.json({
      success: true,
      data: {
        entry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete watchlist entry (soft delete by setting is_active = false)
 */
export const deleteWatchlistEntry = async (
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

    // Check if entry exists
    const existingResult = await pool.query('SELECT * FROM watchlist WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('Watchlist entry not found');
      error.statusCode = 404;
      error.code = 'WATCHLIST_NOT_FOUND';
      return next(error);
    }

    // Soft delete
    const result = await pool.query(
      'UPDATE watchlist SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    const entry = result.rows[0];

    // Log action
    await createAuditLog(
      req.user.id,
      'delete_watchlist_entry',
      'watchlist',
      entry.id,
      { identifier: entry.identifier, deleted_by: req.user.username }
    );

    logger.info(`Watchlist entry deleted: ${entry.identifier} (${entry.id}) by ${req.user.username}`);

    res.json({
      success: true,
      data: {
        entry,
      },
      message: 'Watchlist entry deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};




