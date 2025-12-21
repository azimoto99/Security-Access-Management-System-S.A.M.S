import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import * as alertService from '../services/alertService';

/**
 * Get alerts
 */
export const getAlerts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      type,
      severity,
      job_site_id,
      is_acknowledged,
      limit = '100',
      offset = '0',
    } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (type) filters.type = type as alertService.AlertType;
    if (severity) filters.severity = severity as alertService.AlertSeverity;
    if (job_site_id) filters.job_site_id = job_site_id as string;
    if (is_acknowledged !== undefined) {
      filters.is_acknowledged = is_acknowledged === 'true';
    }

    const result = await alertService.getAlerts(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Acknowledge alert
 */
export const acknowledgeAlert = async (
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

    const alert = await alertService.acknowledgeAlert(id, req.user.id);

    res.json({
      success: true,
      data: {
        alert,
      },
      message: 'Alert acknowledged successfully',
    });
  } catch (error: any) {
    if (error.message === 'Alert not found') {
      const appError: AppError = new Error('Alert not found');
      appError.statusCode = 404;
      appError.code = 'ALERT_NOT_FOUND';
      return next(appError);
    }
    next(error);
  }
};

/**
 * Manually trigger alert checks (admin only)
 */
export const triggerAlertChecks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      const error: AppError = new Error('Admin access required');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    // Run alert checks
    await Promise.all([
      alertService.checkOverstays(),
      alertService.checkCapacityWarnings(),
    ]);

    res.json({
      success: true,
      message: 'Alert checks completed',
    });
  } catch (error) {
    next(error);
  }
};






