import { Response, NextFunction } from 'express';
import pool from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { invalidateCache } from '../middleware/cache';

export interface JobSite {
  id: string;
  name: string;
  address: string;
  contact_info: Record<string, any>;
  vehicle_capacity: number;
  visitor_capacity: number;
  truck_capacity: number;
  is_active: boolean;
  created_at: Date;
}

/**
 * Get all job sites
 */
export const getAllJobSites = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { active_only } = req.query;
    let query = 'SELECT * FROM job_sites';
    const params: any[] = [];

    if (active_only === 'true') {
      query += ' WHERE is_active = $1';
      params.push(true);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        jobSites: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get job site by ID
 */
export const getJobSiteById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM job_sites WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      const error: AppError = new Error('Job site not found');
      error.statusCode = 404;
      error.code = 'JOB_SITE_NOT_FOUND';
      return next(error);
    }

    res.json({
      success: true,
      data: {
        jobSite: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new job site
 */
export const createJobSite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, address, contact_info, vehicle_capacity, visitor_capacity, truck_capacity } =
      req.body;

    // Validate required fields
    if (!name || !address) {
      const error: AppError = new Error('Name and address are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Validate capacity values
    const capacities = {
      vehicle: vehicle_capacity ?? 0,
      visitor: visitor_capacity ?? 0,
      truck: truck_capacity ?? 0,
    };

    if (
      capacities.vehicle < 0 ||
      capacities.visitor < 0 ||
      capacities.truck < 0 ||
      !Number.isInteger(capacities.vehicle) ||
      !Number.isInteger(capacities.visitor) ||
      !Number.isInteger(capacities.truck)
    ) {
      const error: AppError = new Error('Capacity values must be non-negative integers');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Insert job site
    const result = await pool.query(
      `INSERT INTO job_sites (name, address, contact_info, vehicle_capacity, visitor_capacity, truck_capacity, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        address,
        JSON.stringify(contact_info || {}),
        capacities.vehicle,
        capacities.visitor,
        capacities.truck,
        true, // New job sites are active by default
      ]
    );

    const jobSite = result.rows[0];

    // Invalidate cache
    invalidateCache('cache:/api/job-sites');

    // Log action
    if (req.user) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          'create',
          'job_site',
          jobSite.id,
          JSON.stringify({ name: jobSite.name, created_by: req.user.username }),
        ]
      );
    }

    logger.info(`Job site created: ${jobSite.name} (${jobSite.id}) by ${req.user?.username}`);

    res.status(201).json({
      success: true,
      data: {
        jobSite,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update job site
 */
export const updateJobSite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, address, contact_info, vehicle_capacity, visitor_capacity, truck_capacity } =
      req.body;

    // Check if job site exists
    const existingResult = await pool.query('SELECT * FROM job_sites WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('Job site not found');
      error.statusCode = 404;
      error.code = 'JOB_SITE_NOT_FOUND';
      return next(error);
    }

    const existing = existingResult.rows[0];

    // Validate capacity values if provided
    if (
      (vehicle_capacity !== undefined && (vehicle_capacity < 0 || !Number.isInteger(vehicle_capacity))) ||
      (visitor_capacity !== undefined && (visitor_capacity < 0 || !Number.isInteger(visitor_capacity))) ||
      (truck_capacity !== undefined && (truck_capacity < 0 || !Number.isInteger(truck_capacity)))
    ) {
      const error: AppError = new Error('Capacity values must be non-negative integers');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (contact_info !== undefined) {
      updates.push(`contact_info = $${paramCount++}`);
      values.push(JSON.stringify(contact_info));
    }
    if (vehicle_capacity !== undefined) {
      updates.push(`vehicle_capacity = $${paramCount++}`);
      values.push(vehicle_capacity);
    }
    if (visitor_capacity !== undefined) {
      updates.push(`visitor_capacity = $${paramCount++}`);
      values.push(visitor_capacity);
    }
    if (truck_capacity !== undefined) {
      updates.push(`truck_capacity = $${paramCount++}`);
      values.push(truck_capacity);
    }

    if (updates.length === 0) {
      const error: AppError = new Error('No fields to update');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    values.push(id);
    const query = `UPDATE job_sites SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);
    const jobSite = result.rows[0];

    // Log action
    if (req.user) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          'update',
          'job_site',
          jobSite.id,
          JSON.stringify({ name: jobSite.name, updated_by: req.user.username }),
        ]
      );
    }

    // Invalidate cache
    invalidateCache('cache:/api/job-sites');

    logger.info(`Job site updated: ${jobSite.name} (${jobSite.id}) by ${req.user?.username}`);

    res.json({
      success: true,
      data: {
        jobSite,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate job site
 */
export const deactivateJobSite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if job site exists
    const existingResult = await pool.query('SELECT * FROM job_sites WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('Job site not found');
      error.statusCode = 404;
      error.code = 'JOB_SITE_NOT_FOUND';
      return next(error);
    }

    const existing = existingResult.rows[0];

    // Deactivate job site
    const result = await pool.query(
      'UPDATE job_sites SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    const jobSite = result.rows[0];

    // Log action
    if (req.user) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          'deactivate',
          'job_site',
          jobSite.id,
          JSON.stringify({ name: jobSite.name, deactivated_by: req.user.username }),
        ]
      );
    }

    // Invalidate cache
    invalidateCache('cache:/api/job-sites');

    logger.info(`Job site deactivated: ${jobSite.name} (${jobSite.id}) by ${req.user?.username}`);

    res.json({
      success: true,
      data: {
        jobSite,
      },
      message: 'Job site deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate job site
 */
export const activateJobSite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if job site exists
    const existingResult = await pool.query('SELECT * FROM job_sites WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('Job site not found');
      error.statusCode = 404;
      error.code = 'JOB_SITE_NOT_FOUND';
      return next(error);
    }

    const existing = existingResult.rows[0];

    // Activate job site
    const result = await pool.query(
      'UPDATE job_sites SET is_active = true WHERE id = $1 RETURNING *',
      [id]
    );

    const jobSite = result.rows[0];

    // Log action
    if (req.user) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          'activate',
          'job_site',
          jobSite.id,
          JSON.stringify({ name: jobSite.name, activated_by: req.user.username }),
        ]
      );
    }

    // Invalidate cache
    invalidateCache('cache:/api/job-sites');

    logger.info(`Job site activated: ${jobSite.name} (${jobSite.id}) by ${req.user?.username}`);

    res.json({
      success: true,
      data: {
        jobSite,
      },
      message: 'Job site activated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete job site (soft delete by deactivating)
 */
export const deleteJobSite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if job site exists
    const existingResult = await pool.query('SELECT * FROM job_sites WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('Job site not found');
      error.statusCode = 404;
      error.code = 'JOB_SITE_NOT_FOUND';
      return next(error);
    }

    // Check if job site has active entries
    const entriesResult = await pool.query(
      'SELECT COUNT(*) as count FROM entries WHERE job_site_id = $1 AND status = $2',
      [id, 'active']
    );

    if (parseInt(entriesResult.rows[0].count) > 0) {
      const error: AppError = new Error(
        'Cannot delete job site with active entries. Please deactivate instead.'
      );
      error.statusCode = 400;
      error.code = 'JOB_SITE_HAS_ACTIVE_ENTRIES';
      return next(error);
    }

    // For now, we'll just deactivate instead of hard delete to preserve historical data
    // In a real system, you might want to implement soft delete or archive
    const result = await pool.query(
      'UPDATE job_sites SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    const jobSite = result.rows[0];

    // Log action
    if (req.user) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          'delete',
          'job_site',
          jobSite.id,
          JSON.stringify({ name: jobSite.name, deleted_by: req.user.username }),
        ]
      );
    }

    // Invalidate cache
    invalidateCache('cache:/api/job-sites');

    logger.info(`Job site deleted: ${jobSite.name} (${jobSite.id}) by ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Job site deactivated successfully (historical data preserved)',
    });
  } catch (error) {
    next(error);
  }
};


