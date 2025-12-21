import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import * as emergencyService from '../services/emergencyService';
import { occupancyService } from '../services/occupancyService';

/**
 * Get active emergency modes
 */
export const getActiveEmergencyModes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const modes = await emergencyService.getActiveEmergencyModes();
    res.json({
      success: true,
      data: {
        emergency_modes: modes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate emergency mode
 */
export const activateEmergencyMode = async (
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

    const { job_site_id, reason } = req.body;

    const emergencyMode = await emergencyService.activateEmergencyMode(req.user.id, {
      job_site_id,
      reason,
    });

    res.status(201).json({
      success: true,
      data: {
        emergency_mode: emergencyMode,
      },
      message: 'Emergency mode activated successfully',
    });
  } catch (error: any) {
    if (error.message === 'Emergency mode is already active') {
      const appError: AppError = new Error(error.message);
      appError.statusCode = 400;
      appError.code = 'EMERGENCY_ALREADY_ACTIVE';
      return next(appError);
    }
    next(error);
  }
};

/**
 * Deactivate emergency mode
 */
export const deactivateEmergencyMode = async (
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
    const { summary_report } = req.body;

    const emergencyMode = await emergencyService.deactivateEmergencyMode(
      id,
      req.user.id,
      summary_report
    );

    res.json({
      success: true,
      data: {
        emergency_mode: emergencyMode,
      },
      message: 'Emergency mode deactivated successfully',
    });
  } catch (error: any) {
    if (error.message === 'Emergency mode not found or already deactivated') {
      const appError: AppError = new Error(error.message);
      appError.statusCode = 404;
      appError.code = 'EMERGENCY_NOT_FOUND';
      return next(appError);
    }
    next(error);
  }
};

/**
 * Process bulk exit for emergency
 */
export const processBulkExit = async (
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

    const { emergency_mode_id, job_site_id, entry_ids } = req.body;

    if (!emergency_mode_id || !job_site_id) {
      const error: AppError = new Error('emergency_mode_id and job_site_id are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const result = await emergencyService.processBulkExit(
      emergency_mode_id,
      job_site_id,
      req.user.id,
      entry_ids
    );

    res.json({
      success: true,
      data: result,
      message: `Bulk exit processed: ${result.exited_count} entries exited`,
    });
  } catch (error: any) {
    if (error.message === 'Emergency mode is not active') {
      const appError: AppError = new Error(error.message);
      appError.statusCode = 400;
      appError.code = 'EMERGENCY_NOT_ACTIVE';
      return next(appError);
    }
    next(error);
  }
};

/**
 * Get emergency mode occupancy (for evacuation planning)
 */
export const getEmergencyOccupancy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { job_site_id } = req.query;

    if (!job_site_id) {
      // Get all job sites occupancy
      const occupancies = await occupancyService.getOccupancies();
      res.json({
        success: true,
        data: {
          occupancies,
        },
      });
    } else {
      // Get specific job site occupancy
      const occupancy = await occupancyService.getJobSiteOccupancy(job_site_id as string);
      if (!occupancy) {
        const error: AppError = new Error('Job site not found');
        error.statusCode = 404;
        error.code = 'JOB_SITE_NOT_FOUND';
        return next(error);
      }
      res.json({
        success: true,
        data: {
          occupancy,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get emergency mode history
 */
export const getEmergencyModeHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = '50', offset = '0' } = req.query;

    const result = await emergencyService.getEmergencyModeHistory(
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};








