import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as occupancyService from '../services/occupancyService';

/**
 * Get occupancy for all job sites
 */
export const getAllOccupancy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const occupancies = await occupancyService.calculateAllOccupancy();

    // Filter by user access if not admin
    if (req.user && req.user.role !== 'admin' && req.user.job_site_access) {
      const filtered = occupancies.filter((occ) =>
        req.user?.job_site_access?.includes(occ.job_site_id)
      );
      res.json({
        success: true,
        data: {
          occupancies: filtered,
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          occupancies,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get occupancy for a specific job site
 */
export const getJobSiteOccupancy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobSiteId } = req.params;

    const occupancy = await occupancyService.calculateJobSiteOccupancy(jobSiteId);

    if (!occupancy) {
      const error: AppError = new Error('Job site not found');
      error.statusCode = 404;
      error.code = 'JOB_SITE_NOT_FOUND';
      return next(error);
    }

    // Check access if not admin
    if (req.user && req.user.role !== 'admin' && req.user.job_site_access) {
      if (!req.user.job_site_access.includes(jobSiteId)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
    }

    res.json({
      success: true,
      data: {
        occupancy,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed breakdown for a job site
 */
export const getJobSiteBreakdown = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobSiteId } = req.params;

    // Check access if not admin
    if (req.user && req.user.role !== 'admin' && req.user.job_site_access) {
      if (!req.user.job_site_access.includes(jobSiteId)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
    }

    const breakdown = await occupancyService.getJobSiteBreakdown(jobSiteId);

    res.json({
      success: true,
      data: {
        breakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};









