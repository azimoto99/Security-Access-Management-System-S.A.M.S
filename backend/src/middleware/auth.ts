import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    job_site_access?: string[];
  };
}

/**
 * Authenticate JWT token
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    const error: AppError = new Error('Authentication token required');
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    return next(error);
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      const appError: AppError = new Error('Token expired');
      appError.statusCode = 401;
      appError.code = 'TOKEN_EXPIRED';
      return next(appError);
    }
    const appError: AppError = new Error('Invalid token');
    appError.statusCode = 403;
    appError.code = 'FORBIDDEN';
    return next(appError);
  }
};

/**
 * Authorize by role
 */
export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const error: AppError = new Error('Insufficient permissions');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    next();
  };
};

/**
 * Authorize by job site access
 */
export const authorizeJobSite = (jobSiteId: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    // Admins have access to all job sites
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has access to this job site
    const jobSiteAccess = req.user.job_site_access || [];
    if (!jobSiteAccess.includes(jobSiteId)) {
      const error: AppError = new Error('Access denied to this job site');
      error.statusCode = 403;
      error.code = 'JOB_SITE_ACCESS_DENIED';
      return next(error);
    }

    next();
  };
};

