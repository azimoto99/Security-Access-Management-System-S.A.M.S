import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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
 * Supports token from Authorization header or query string (for image requests)
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Try to get token from Authorization header first
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // If no token in header, try query string (for image requests)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

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
      // For photo requests, allow expired tokens within a grace period (5 minutes)
      // This handles the case where token expires between page load and image request
      const isPhotoRequest = req.path.includes('/photos/') && req.method === 'GET';
      
      if (isPhotoRequest) {
        try {
          // Try to decode the expired token to check expiration time
          const decoded = jwt.decode(token) as any;
          
          if (decoded && decoded.exp) {
            const expirationTime = decoded.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const gracePeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
            
            // If token expired within the last 5 minutes, allow the request
            if (now - expirationTime < gracePeriod) {
              req.user = {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role,
                job_site_access: decoded.job_site_access || [],
              };
              return next();
            }
          }
        } catch (decodeError) {
          // If we can't decode, fall through to error
        }
      }
      
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

