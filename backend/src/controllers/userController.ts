import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditLogService';

/**
 * Get all users
 */
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, username, role, job_site_access, employee_id, onboarding_status, created_at, is_active
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: {
        users: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, username, role, job_site_access, employee_id, onboarding_status, created_at, is_active
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      return next(error);
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 */
export const createUser = async (
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

    const { username, password, role, job_site_access, employee_id } = req.body;

    // Validate required fields
    if (!username || !password || !role) {
      const error: AppError = new Error('Username, password, and role are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Validate role
    if (!['guard', 'admin', 'employee', 'client'].includes(role)) {
      const error: AppError = new Error('Invalid role. Must be guard, admin, employee, or client');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Validate password
    if (password.length < 8) {
      const error: AppError = new Error('Password must be at least 8 characters long');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Check if username already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      const error: AppError = new Error('Username already exists');
      error.statusCode = 400;
      error.code = 'USERNAME_EXISTS';
      return next(error);
    }

    // Validate job site access if provided
    if (job_site_access && Array.isArray(job_site_access) && job_site_access.length > 0) {
      const jobSitesResult = await pool.query(
        'SELECT id FROM job_sites WHERE id = ANY($1)',
        [job_site_access]
      );
      if (jobSitesResult.rows.length !== job_site_access.length) {
        const error: AppError = new Error('One or more job sites are invalid');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, job_site_access, employee_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, role, job_site_access, employee_id, onboarding_status, created_at, is_active`,
      [
        username,
        passwordHash,
        role,
        JSON.stringify(job_site_access || []),
        employee_id || null,
        true,
      ]
    );

    const user = result.rows[0];

    // Log action
    await createAuditLog(
      req.user.id,
      'create_user',
      'user',
      user.id,
      { username: user.username, role: user.role, created_by: req.user.username }
    );

    logger.info(`User created: ${user.username} (${user.id}) by ${req.user.username}`);

    res.status(201).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 */
export const updateUser = async (
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
    const { username, role, job_site_access, employee_id, onboarding_status } = req.body;

    // Check if user exists
    const existingResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      return next(error);
    }

    const existing = existingResult.rows[0];

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (username !== undefined && username !== existing.username) {
      // Check if new username already exists
      const usernameCheck = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [
        username,
        id,
      ]);
      if (usernameCheck.rows.length > 0) {
        const error: AppError = new Error('Username already exists');
        error.statusCode = 400;
        error.code = 'USERNAME_EXISTS';
        return next(error);
      }
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }

    if (role !== undefined && role !== existing.role) {
      if (!['guard', 'admin', 'employee', 'client'].includes(role)) {
        const error: AppError = new Error('Invalid role');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (job_site_access !== undefined) {
      // Validate job site access
      if (Array.isArray(job_site_access) && job_site_access.length > 0) {
        const jobSitesResult = await pool.query(
          'SELECT id FROM job_sites WHERE id = ANY($1)',
          [job_site_access]
        );
        if (jobSitesResult.rows.length !== job_site_access.length) {
          const error: AppError = new Error('One or more job sites are invalid');
          error.statusCode = 400;
          error.code = 'VALIDATION_ERROR';
          return next(error);
        }
      }
      updates.push(`job_site_access = $${paramCount++}`);
      values.push(JSON.stringify(job_site_access));
    }

    if (employee_id !== undefined) {
      updates.push(`employee_id = $${paramCount++}`);
      values.push(employee_id || null);
    }

    if (onboarding_status !== undefined) {
      if (!['pending', 'in_progress', 'completed'].includes(onboarding_status) && onboarding_status !== null) {
        const error: AppError = new Error('Invalid onboarding status');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }
      updates.push(`onboarding_status = $${paramCount++}`);
      values.push(onboarding_status);
    }

    if (updates.length === 0) {
      const error: AppError = new Error('No fields to update');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, role, job_site_access, employee_id, onboarding_status, created_at, is_active`;

    const result = await pool.query(query, values);
    const user = result.rows[0];

    // Log action
    await createAuditLog(
      req.user.id,
      'update_user',
      'user',
      user.id,
      { username: user.username, updated_by: req.user.username }
    );

    logger.info(`User updated: ${user.username} (${user.id}) by ${req.user.username}`);

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate user
 */
export const deactivateUser = async (
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

    // Check if user exists
    const existingResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      return next(error);
    }

    const existing = existingResult.rows[0];

    // Prevent deactivating yourself
    if (id === req.user.id) {
      const error: AppError = new Error('Cannot deactivate your own account');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Deactivate user
    const result = await pool.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, username, role, is_active',
      [id]
    );

    const user = result.rows[0];

    // Log action
    await createAuditLog(
      req.user.id,
      'deactivate_user',
      'user',
      user.id,
      { username: user.username, deactivated_by: req.user.username }
    );

    logger.info(`User deactivated: ${user.username} (${user.id}) by ${req.user.username}`);

    res.json({
      success: true,
      data: {
        user,
      },
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate user
 */
export const activateUser = async (
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

    // Check if user exists
    const existingResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      return next(error);
    }

    // Activate user
    const result = await pool.query(
      'UPDATE users SET is_active = true WHERE id = $1 RETURNING id, username, role, is_active',
      [id]
    );

    const user = result.rows[0];

    // Log action
    await createAuditLog(
      req.user.id,
      'activate_user',
      'user',
      user.id,
      { username: user.username, activated_by: req.user.username }
    );

    logger.info(`User activated: ${user.username} (${user.id}) by ${req.user.username}`);

    res.json({
      success: true,
      data: {
        user,
      },
      message: 'User activated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password (admin only - set specific password)
 */
export const changeUserPassword = async (
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
    const { password } = req.body;

    // Validate password
    if (!password) {
      const error: AppError = new Error('Password is required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    if (password.length < 8) {
      const error: AppError = new Error('Password must be at least 8 characters long');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Check if user exists
    const existingResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      return next(error);
    }

    const existing = existingResult.rows[0];

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);

    // Log action
    await createAuditLog(
      req.user.id,
      'change_password',
      'user',
      id,
      { username: existing.username, changed_by: req.user.username }
    );

    logger.info(`Password changed for user: ${existing.username} (${id}) by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user password (generate temporary password)
 */
export const resetUserPassword = async (
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

    // Check if user exists
    const existingResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      return next(error);
    }

    const existing = existingResult.rows[0];

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Update password
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);

    // Log action
    await createAuditLog(
      req.user.id,
      'reset_password',
      'user',
      id,
      { username: existing.username, reset_by: req.user.username }
    );

    logger.info(`Password reset for user: ${existing.username} (${id}) by ${req.user.username}`);

    res.json({
      success: true,
      data: {
        temporary_password: tempPassword,
      },
      message: 'Password reset successfully. Temporary password generated.',
    });
  } catch (error) {
    next(error);
  }
};






