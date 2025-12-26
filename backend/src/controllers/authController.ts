import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, generatePasswordResetToken, verifyPasswordResetToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { recordFailedLogin, clearFailedLoginAttempts } from '../services/alertService';

/**
 * Login user
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      const error: AppError = new Error('Username and password are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Find user by username
    const userResult = await pool.query(
      'SELECT id, username, password_hash, role, job_site_access, is_active FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      // Record failed login attempt
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.get('user-agent') || undefined;
      await recordFailedLogin(username, ipAddress, userAgent);

      const error: AppError = new Error('Invalid credentials');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      return next(error);
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      const error: AppError = new Error('Account is deactivated');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DEACTIVATED';
      return next(error);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      // Record failed login attempt
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.get('user-agent') || undefined;
      await recordFailedLogin(username, ipAddress, userAgent);

      const error: AppError = new Error('Invalid credentials');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      return next(error);
    }

    // Clear failed login attempts on successful login
    await clearFailedLoginAttempts(username);

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      role: user.role,
      job_site_access: user.job_site_access || [],
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      username: user.username,
      role: user.role,
      job_site_access: user.job_site_access || [],
    });

    // Log successful login
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        'login',
        'user',
        user.id,
        JSON.stringify({ username: user.username, timestamp: new Date().toISOString() }),
      ]
    );

    logger.info(`User logged in: ${user.username} (${user.id})`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          job_site_access: user.job_site_access || [],
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const error: AppError = new Error('Refresh token is required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database
    const userResult = await pool.query(
      'SELECT id, username, role, job_site_access, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      return next(error);
    }

    const user = userResult.rows[0];

    // Check if user is still active
    if (!user.is_active) {
      const error: AppError = new Error('Account is deactivated');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DEACTIVATED';
      return next(error);
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      role: user.role,
      job_site_access: user.job_site_access || [],
    });

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      const appError: AppError = new Error('Refresh token expired');
      appError.statusCode = 401;
      appError.code = 'TOKEN_EXPIRED';
      return next(appError);
    }
    next(error);
  }
};

/**
 * Logout user
 */
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      // Log logout action
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          'logout',
          'user',
          req.user.id,
          JSON.stringify({ username: req.user.username, timestamp: new Date().toISOString() }),
        ]
      );

      logger.info(`User logged out: ${req.user.username} (${req.user.id})`);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username } = req.body;

    if (!username) {
      const error: AppError = new Error('Username is required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Find user by username
    const userResult = await pool.query(
      'SELECT id, username FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    // Don't reveal if user exists or not (security best practice)
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const resetToken = generatePasswordResetToken(user.id);

      // In a real application, you would send an email with the reset token
      // For now, we'll just log it (in development) or return success
      if (process.env.NODE_ENV === 'development') {
        logger.info(`Password reset token for ${user.username}: ${resetToken}`);
      }

      // Log password reset request
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          user.id,
          'password_reset_requested',
          'user',
          user.id,
          JSON.stringify({ username: user.username, timestamp: new Date().toISOString() }),
        ]
      );
    }

    // Always return success to prevent user enumeration
    res.json({
      success: true,
      message: 'If the username exists, a password reset link has been sent',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      const error: AppError = new Error('Token and new password are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    if (newPassword.length < 8) {
      const error: AppError = new Error('Password must be at least 8 characters long');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Verify reset token
    const decoded = verifyPasswordResetToken(token);

    // Get user
    const userResult = await pool.query('SELECT id, username FROM users WHERE id = $1 AND is_active = true', [
      decoded.id,
    ]);

    if (userResult.rows.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      return next(error);
    }

    const user = userResult.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);

    // Log password reset
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        'password_reset',
        'user',
        user.id,
        JSON.stringify({ username: user.username, timestamp: new Date().toISOString() }),
      ]
    );

    logger.info(`Password reset for user: ${user.username} (${user.id})`);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      const appError: AppError = new Error('Password reset token expired');
      appError.statusCode = 401;
      appError.code = 'TOKEN_EXPIRED';
      return next(appError);
    }
    next(error);
  }
};

/**
 * Get current user info
 */
export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Not authenticated');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    // Get full user info from database
    const userResult = await pool.query(
      'SELECT id, username, role, job_site_access, employee_id, onboarding_status, created_at, is_active FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      return next(error);
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          job_site_access: user.job_site_access || [],
          employee_id: user.employee_id,
          onboarding_status: user.onboarding_status,
          created_at: user.created_at,
          is_active: user.is_active,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change own password (self-service)
 */
export const changeOwnPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    const { newPassword } = req.body;

    // Validate password
    if (!newPassword) {
      const error: AppError = new Error('New password is required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    if (newPassword.length < 8) {
      const error: AppError = new Error('Password must be at least 8 characters long');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Get user info
    const userResult = await pool.query('SELECT id, username FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      return next(error);
    }

    const user = userResult.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id]);

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'change_password',
        'user',
        req.user.id,
        JSON.stringify({ username: user.username, self_service: true }),
      ]
    );

    logger.info(`Password changed by user: ${user.username} (${req.user.id})`);

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

