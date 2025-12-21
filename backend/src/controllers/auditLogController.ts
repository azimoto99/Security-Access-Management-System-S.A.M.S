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

    const filters = {
      user_id: user_id as string,
      action: action as string,
      resource_type: resource_type as string,
      resource_id: resource_id as string,
      date_from: date_from as string,
      date_to: date_to as string,
      page: parseInt(page as string) || 1,
      limit: Math.min(parseInt(limit as string) || 50, 100),
    };

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
    const {
      user_id,
      action,
      resource_type,
      resource_id,
      date_from,
      date_to,
    } = req.query;

    const filters = {
      user_id: user_id as string,
      action: action as string,
      resource_type: resource_type as string,
      resource_id: resource_id as string,
      date_from: date_from as string,
      date_to: date_to as string,
      page: 1,
      limit: 10000, // Large limit for export
    };

    const result = await auditLogService.getAuditLogs(filters);
    const csv = exportLogsToCSV(result.logs);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};






