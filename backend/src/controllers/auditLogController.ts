import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as auditLogService from '../services/auditLogService';
import { exportLogsToCSV } from '../utils/exportService';

/**
 * Get audit logs
 */
export const getAuditLogs = async (
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

    const {
      user_id,
      action,
      resource_type,
      resource_id,
      date_from,
      date_to,
      page = '1',
      limit = '50',
    } = req.query;

    const filters: any = {
      page: parseInt(page as string) || 1,
      limit: Math.min(parseInt(limit as string) || 50, 100),
    };

    // Only add filters if they have values
    if (user_id) filters.user_id = user_id as string;
    if (action) filters.action = action as string;
    if (resource_type) filters.resource_type = resource_type as string;
    if (resource_id) filters.resource_id = resource_id as string;
    if (date_from) filters.date_from = date_from as string;
    if (date_to) filters.date_to = date_to as string;

    // For guards, filter by their accessible job sites
    // Admins see all logs
    if (req.user.role !== 'admin' && req.user.job_site_access) {
      filters.job_site_ids = req.user.job_site_access;
    }

    const result = await auditLogService.getAuditLogs(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export audit logs to CSV
 */
export const exportAuditLogs = async (
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

    const {
      user_id,
      action,
      resource_type,
      resource_id,
      date_from,
      date_to,
    } = req.query;

    const filters: any = {
      page: 1,
      limit: 10000, // Large limit for export
    };

    // Only add filters if they have values
    if (user_id) filters.user_id = user_id as string;
    if (action) filters.action = action as string;
    if (resource_type) filters.resource_type = resource_type as string;
    if (resource_id) filters.resource_id = resource_id as string;
    if (date_from) filters.date_from = date_from as string;
    if (date_to) filters.date_to = date_to as string;

    // For guards, filter by their accessible job sites
    // Admins see all logs
    if (req.user.role !== 'admin' && req.user.job_site_access) {
      filters.job_site_ids = req.user.job_site_access;
    }

    const result = await auditLogService.getAuditLogs(filters);
    const csv = exportLogsToCSV(result.logs);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};






