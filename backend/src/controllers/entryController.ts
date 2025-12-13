import { Response, NextFunction } from 'express';
import pool from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import {
  EntryType,
  EntryStatus,
  CreateEntryRequest,
  ExitEntryRequest,
  SearchEntriesRequest,
  validateEntryData,
} from '../utils/entryValidation';
import { authorizeJobSite } from '../middleware/auth';
import { webSocketService } from '../services/websocketService';
import { checkWatchlistMatch } from '../services/alertService';
import { isEmergencyModeActive } from '../services/emergencyService';

/**
 * Create entry (vehicle, visitor, or truck)
 */
export const createEntry = async (
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

    const { job_site_id, entry_type, entry_data, photos } = req.body as CreateEntryRequest;

    // Validate required fields
    if (!job_site_id || !entry_type || !entry_data) {
      const error: AppError = new Error('job_site_id, entry_type, and entry_data are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Validate entry type
    if (!['vehicle', 'visitor', 'truck'].includes(entry_type)) {
      const error: AppError = new Error('Invalid entry type. Must be vehicle, visitor, or truck');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Check job site exists and is active
    const jobSiteResult = await pool.query('SELECT * FROM job_sites WHERE id = $1', [job_site_id]);
    if (jobSiteResult.rows.length === 0) {
      const error: AppError = new Error('Job site not found');
      error.statusCode = 404;
      error.code = 'JOB_SITE_NOT_FOUND';
      return next(error);
    }

    const jobSite = jobSiteResult.rows[0];
    if (!jobSite.is_active) {
      const error: AppError = new Error('Job site is not active');
      error.statusCode = 400;
      error.code = 'JOB_SITE_INACTIVE';
      return next(error);
    }

    // Check if emergency mode is active
    const emergencyActive = await isEmergencyModeActive(job_site_id);
    if (emergencyActive) {
      const error: AppError = new Error('Emergency mode is active. Normal entry processing is disabled.');
      error.statusCode = 403;
      error.code = 'EMERGENCY_MODE_ACTIVE';
      return next(error);
    }

    // Check job site access (unless admin)
    if (req.user.role !== 'admin') {
      const jobSiteAccess = req.user.job_site_access || [];
      if (!jobSiteAccess.includes(job_site_id)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
    }

    // Validate entry data
    let validatedData;
    try {
      validatedData = validateEntryData(entry_type as EntryType, entry_data);
    } catch (validationError: any) {
      const error: AppError = new Error(validationError.message);
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Insert entry
    const result = await pool.query(
      `INSERT INTO entries (job_site_id, entry_type, entry_data, guard_id, photos, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        job_site_id,
        entry_type,
        JSON.stringify(validatedData),
        req.user.id,
        JSON.stringify(photos || []),
        'active',
      ]
    );

    const entry = result.rows[0];

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'create_entry',
        'entry',
        entry.id,
        JSON.stringify({
          entry_type,
          job_site_id,
          created_by: req.user.username,
        }),
      ]
    );

    logger.info(`Entry created: ${entry_type} (${entry.id}) by ${req.user.username}`);

    // Check for watchlist match
    try {
      const watchlistAlert = await checkWatchlistMatch(
        entry_type as 'vehicle' | 'visitor' | 'truck',
        validatedData,
        job_site_id,
        entry.id
      );
      if (watchlistAlert) {
        logger.warn(`Watchlist match detected for entry ${entry.id}: ${watchlistAlert.title}`);
      }
    } catch (err) {
      logger.error('Error checking watchlist:', err);
      // Don't fail entry creation if watchlist check fails
    }

    // Broadcast occupancy update
    webSocketService.broadcastOccupancyUpdate(job_site_id).catch((err) => {
      logger.error('Error broadcasting occupancy update:', err);
    });

    res.status(201).json({
      success: true,
      data: {
        entry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active entries for a job site
 */
export const getActiveEntries = async (
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

    const { jobSiteId } = req.params;
    const { entry_type } = req.query;

    // Check job site access if not admin
    if (req.user.role !== 'admin') {
      const jobSiteAccess = req.user.job_site_access || [];
      if (!jobSiteAccess.includes(jobSiteId)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
    }

    let query = 'SELECT * FROM entries WHERE job_site_id = $1 AND status = $2';
    const params: any[] = [jobSiteId, 'active'];

    if (entry_type && ['vehicle', 'visitor', 'truck'].includes(entry_type as string)) {
      query += ' AND entry_type = $3';
      params.push(entry_type);
    }

    query += ' ORDER BY entry_time DESC';

    const result = await pool.query(query, params);

    // Ensure entry_data and photos are parsed (pg should do this automatically, but ensure it)
    const entries = result.rows.map((row) => ({
      ...row,
      entry_data: typeof row.entry_data === 'string' ? JSON.parse(row.entry_data) : row.entry_data,
      photos: typeof row.photos === 'string' ? JSON.parse(row.photos) : (row.photos || []),
    }));

    res.json({
      success: true,
      data: {
        entries,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process exit
 */
export const processExit = async (
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

    const { entry_id, override, override_reason } = req.body as ExitEntryRequest;

    if (!entry_id) {
      const error: AppError = new Error('entry_id is required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Get entry
    const entryResult = await pool.query('SELECT * FROM entries WHERE id = $1', [entry_id]);
    if (entryResult.rows.length === 0) {
      const error: AppError = new Error('Entry not found');
      error.statusCode = 404;
      error.code = 'ENTRY_NOT_FOUND';
      return next(error);
    }

    const entry = entryResult.rows[0];

    // Check if already exited
    if (entry.status !== 'active') {
      const error: AppError = new Error('Entry has already been exited');
      error.statusCode = 400;
      error.code = 'ENTRY_ALREADY_EXITED';
      return next(error);
    }

    // Check job site access (unless admin)
    if (req.user.role !== 'admin') {
      const jobSiteAccess = req.user.job_site_access || [];
      if (!jobSiteAccess.includes(entry.job_site_id)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
    }

    // Calculate duration
    const entryTime = new Date(entry.entry_time);
    const exitTime = new Date();
    const durationMinutes = Math.floor((exitTime.getTime() - entryTime.getTime()) / (1000 * 60));

    // Update entry
    const updateResult = await pool.query(
      'UPDATE entries SET exit_time = $1, status = $2 WHERE id = $3 RETURNING *',
      [exitTime, override ? 'emergency_exit' : 'exited', entry_id]
    );

    const updatedEntry = updateResult.rows[0];

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        override ? 'exit_override' : 'exit',
        'entry',
        entry.id,
        JSON.stringify({
          duration_minutes: durationMinutes,
          override,
          override_reason,
          processed_by: req.user.username,
        }),
      ]
    );

    logger.info(`Entry exited: ${entry.entry_type} (${entry.id}) by ${req.user.username}`);

    // Broadcast occupancy update
    webSocketService.broadcastOccupancyUpdate(entry.job_site_id).catch((err) => {
      logger.error('Error broadcasting occupancy update:', err);
    });

    res.json({
      success: true,
      data: {
        entry: updatedEntry,
        duration_minutes: durationMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search entries with advanced filtering and pagination
 */
export const searchEntries = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      job_site_id,
      entry_type,
      status,
      license_plate,
      name,
      company,
      date_from,
      date_to,
      guard_id,
      page = '1',
      limit = '50',
      search_term, // General search term that searches across multiple fields
    } = req.query as SearchEntriesRequest & { page?: string; limit?: string; search_term?: string };

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT 
        e.*,
        js.name as job_site_name,
        u.username as guard_username
      FROM entries e
      LEFT JOIN job_sites js ON e.job_site_id = js.id
      LEFT JOIN users u ON e.guard_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    // Check job site access if not admin
    if (req.user && req.user.role !== 'admin' && req.user.job_site_access) {
      if (job_site_id && !req.user.job_site_access.includes(job_site_id)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
      // Filter by accessible job sites
      query += ` AND e.job_site_id = ANY($${paramCount++})`;
      params.push(req.user.job_site_access);
    }

    // Build query dynamically
    if (job_site_id) {
      query += ` AND e.job_site_id = $${paramCount++}`;
      params.push(job_site_id);
    }

    if (entry_type) {
      query += ` AND e.entry_type = $${paramCount++}`;
      params.push(entry_type);
    }

    if (status) {
      query += ` AND e.status = $${paramCount++}`;
      params.push(status);
    }

    if (guard_id) {
      query += ` AND e.guard_id = $${paramCount++}`;
      params.push(guard_id);
    }

    if (date_from) {
      query += ` AND e.entry_time >= $${paramCount++}`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND e.entry_time <= $${paramCount++}`;
      params.push(date_to);
    }

    // JSONB search for license_plate, name, company, or general search_term
    if (license_plate || name || company || search_term) {
      const searchConditions: string[] = [];
      
      if (license_plate) {
        searchConditions.push(`e.entry_data->>'license_plate' ILIKE $${paramCount}`);
        params.push(`%${license_plate}%`);
        paramCount++;
      }

      if (name) {
        searchConditions.push(
          `(e.entry_data->>'name' ILIKE $${paramCount} OR e.entry_data->>'driver_name' ILIKE $${paramCount})`
        );
        params.push(`%${name}%`);
        paramCount++;
      }

      if (company) {
        searchConditions.push(`e.entry_data->>'company' ILIKE $${paramCount}`);
        params.push(`%${company}%`);
        paramCount++;
      }

      if (search_term) {
        // General search across multiple fields
        searchConditions.push(
          `(
            e.entry_data->>'license_plate' ILIKE $${paramCount} OR
            e.entry_data->>'truck_number' ILIKE $${paramCount} OR
            e.entry_data->>'name' ILIKE $${paramCount} OR
            e.entry_data->>'driver_name' ILIKE $${paramCount} OR
            e.entry_data->>'company' ILIKE $${paramCount}
          )`
        );
        params.push(`%${search_term}%`);
        paramCount++;
      }

      if (searchConditions.length > 0) {
        query += ` AND (${searchConditions.join(' OR ')})`;
      }
    }

    // Get total count for pagination
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add ordering and pagination
    query += ` ORDER BY 
      CASE WHEN e.status = 'active' THEN 0 ELSE 1 END,
      e.entry_time DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    // Transform results to include job site name and guard username
    const entries = result.rows.map((row) => {
      const { job_site_name, guard_username, ...entry } = row;
      return {
        ...entry,
        job_site_name,
        guard_username,
      };
    });

    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get entry by ID
 */
export const getEntryById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM entries WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      const error: AppError = new Error('Entry not found');
      error.statusCode = 404;
      error.code = 'ENTRY_NOT_FOUND';
      return next(error);
    }

    res.json({
      success: true,
      data: {
        entry: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

