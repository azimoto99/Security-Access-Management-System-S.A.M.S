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
  VehicleEntryData,
  TruckEntryData,
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

    // Broadcast entry created event
    const entryData = typeof entry.entry_data === 'string' ? JSON.parse(entry.entry_data) : entry.entry_data;
    const entryPhotos = typeof entry.photos === 'string' ? JSON.parse(entry.photos) : (entry.photos || []);
    webSocketService.broadcastEntryCreated(
      {
        ...entry,
        entry_data: entryData,
        photos: entryPhotos,
      },
      job_site_id
    );

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
    // Admins can see all entries from all job sites, regardless of who created them (guard_id)
    if (req.user.role !== 'admin') {
      const jobSiteAccess = req.user.job_site_access || [];
      if (!jobSiteAccess.includes(jobSiteId)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
    }

    // Query all active entries for the job site - no filter by guard_id
    // This ensures admins can see entries created by guards
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
 * Create manual exit (for vehicles/trucks not logged in)
 */
export const createManualExit = async (
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

    const { job_site_id, entry_type, entry_data } = req.body as CreateEntryRequest;

    // Validate required fields
    if (!job_site_id || !entry_type || !entry_data) {
      const error: AppError = new Error('job_site_id, entry_type, and entry_data are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Only allow vehicle and truck types for manual exits
    if (!['vehicle', 'truck'].includes(entry_type)) {
      const error: AppError = new Error('Manual exit only allowed for vehicles and trucks');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Validate required fields - use type assertion since we've validated entry_type
    const vehicleOrTruckData = entry_data as VehicleEntryData | TruckEntryData;
    
    if (!vehicleOrTruckData.license_plate) {
      const error: AppError = new Error('License plate is required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    if (entry_type === 'truck') {
      const truckData = entry_data as TruckEntryData;
      if (!truckData.truck_number) {
        const error: AppError = new Error('Truck number is required for trucks');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }
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

    // Set entry_time to NULL (N/A) and exit_time to current time for manual exits
    const now = new Date();

    // Insert entry with entry_time as NULL and exit_time set immediately
    const result = await pool.query(
      `INSERT INTO entries (job_site_id, entry_type, entry_data, guard_id, photos, status, entry_time, exit_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        job_site_id,
        entry_type,
        JSON.stringify(entry_data),
        req.user.id,
        JSON.stringify([]),
        'exited',
        null, // entry_time is NULL for manual exits
        now,
      ]
    );

    const entry = result.rows[0];

    // Log action - use type assertions for audit log
    const auditData: any = {
      entry_type,
      job_site_id,
      license_plate: vehicleOrTruckData.license_plate,
      created_by: req.user.username,
    };
    
    if (entry_type === 'truck') {
      const truckData = entry_data as TruckEntryData;
      auditData.truck_number = truckData.truck_number;
      // destination is not in TruckEntryData type, but may be in entry_data as additional field
      if ('destination' in entry_data && entry_data.destination) {
        auditData.destination = (entry_data as any).destination;
      }
    }
    
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          'manual_exit',
          'entry',
          entry.id,
          JSON.stringify(auditData),
        ]
      );
    } catch (auditError: any) {
      // Log audit error but don't fail the manual exit creation
      logger.error('Error creating audit log for manual exit:', auditError);
    }

    logger.info(`Manual exit created: ${entry_type} (${entry.id}) by ${req.user.username}`);

    // Don't broadcast occupancy update for manual exits - they don't affect occupancy
    // since they're created with status='exited' and won't be counted in occupancy calculations

    res.status(201).json({
      success: true,
      data: {
        entry,
      },
    });
  } catch (error: any) {
    logger.error('Error creating manual exit:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      user: req.user?.username,
      role: req.user?.role,
      body: req.body,
    });
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

    const { entry_id, override, override_reason, trailer_number } = req.body as ExitEntryRequest;

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

    // Update entry_data if trailer_number is provided (for trucks)
    // Store both entry_trailer_number (original) and exit_trailer_number (new)
    let updatedEntryData = entry.entry_data;
    if (trailer_number !== undefined && entry.entry_type === 'truck') {
      const entryTrailerNumber = entry.entry_data.trailer_number;
      updatedEntryData = {
        ...entry.entry_data,
        entry_trailer_number: entryTrailerNumber, // Store original entry trailer number
        exit_trailer_number: trailer_number.trim() || undefined, // Store exit trailer number
      };
    }

    // Update entry
    const updateResult = await pool.query(
      'UPDATE entries SET exit_time = $1, status = $2, entry_data = $3 WHERE id = $4 RETURNING *',
      [
        exitTime,
        override ? 'emergency_exit' : 'exited',
        JSON.stringify(updatedEntryData),
        entry_id,
      ]
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
          ...(trailer_number !== undefined && entry.entry_type === 'truck' ? {
            exit_trailer_number: trailer_number.trim() || undefined,
          } : {}),
        }),
      ]
    );

    logger.info(`Entry exited: ${entry.entry_type} (${entry.id}) by ${req.user.username}`);

    // Broadcast occupancy update
    webSocketService.broadcastOccupancyUpdate(entry.job_site_id).catch((err) => {
      logger.error('Error broadcasting occupancy update:', err);
    });

    // Broadcast entry updated event
    const updatedEntryData = typeof updatedEntry.entry_data === 'string' ? JSON.parse(updatedEntry.entry_data) : updatedEntry.entry_data;
    const updatedEntryPhotos = typeof updatedEntry.photos === 'string' ? JSON.parse(updatedEntry.photos) : (updatedEntry.photos || []);
    webSocketService.broadcastEntryUpdated(
      {
        ...updatedEntry,
        entry_data: updatedEntryData,
        photos: updatedEntryPhotos,
      },
      entry.job_site_id
    );

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
    // Admins can see all entries from all job sites, regardless of who created them
    if (req.user && req.user.role !== 'admin' && req.user.job_site_access) {
      if (job_site_id && !req.user.job_site_access.includes(job_site_id)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
      // Filter by accessible job sites (non-admins only)
      query += ` AND e.job_site_id = ANY($${paramCount++})`;
      params.push(req.user.job_site_access);
    }
    // Note: Admins see all entries from all job sites - no job site filter applied

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
      // Include manual exits (entry_time IS NULL) by checking exit_time instead
      // For normal entries, use entry_time; for manual exits, use exit_time
      query += ` AND (
        (e.entry_time IS NOT NULL AND e.entry_time >= $${paramCount}) OR
        (e.entry_time IS NULL AND e.exit_time >= $${paramCount})
      )`;
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      // Include manual exits (entry_time IS NULL) by checking exit_time instead
      query += ` AND (
        (e.entry_time IS NOT NULL AND e.entry_time <= $${paramCount}) OR
        (e.entry_time IS NULL AND e.exit_time <= $${paramCount})
      )`;
      params.push(date_to);
      paramCount++;
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
    // Build count query by replacing SELECT...FROM with COUNT
    const countQuery = query
      .replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
      .replace(/ORDER BY[\s\S]*$/, ''); // Remove ORDER BY and LIMIT/OFFSET for count
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add ordering and pagination
    // For manual exits (entry_time IS NULL), use exit_time for ordering
    query += ` ORDER BY 
      CASE WHEN e.status = 'active' THEN 0 ELSE 1 END,
      COALESCE(e.entry_time, e.exit_time) DESC
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

/**
 * Update entry
 */
export const updateEntry = async (
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
    const { job_site_id, entry_type, entry_data, photos } = req.body;

    // Get existing entry
    const existingResult = await pool.query('SELECT * FROM entries WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('Entry not found');
      error.statusCode = 404;
      error.code = 'ENTRY_NOT_FOUND';
      return next(error);
    }

    const existingEntry = existingResult.rows[0];

    // Check job site access (unless admin)
    if (req.user.role !== 'admin') {
      const jobSiteAccess = req.user.job_site_access || [];
      const targetJobSiteId = job_site_id || existingEntry.job_site_id;
      if (!jobSiteAccess.includes(targetJobSiteId)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (job_site_id) {
      // Verify job site exists
      const jobSiteResult = await pool.query('SELECT * FROM job_sites WHERE id = $1', [job_site_id]);
      if (jobSiteResult.rows.length === 0) {
        const error: AppError = new Error('Job site not found');
        error.statusCode = 404;
        error.code = 'JOB_SITE_NOT_FOUND';
        return next(error);
      }
      updates.push(`job_site_id = $${paramCount++}`);
      params.push(job_site_id);
    }

    if (entry_type) {
      if (!['vehicle', 'visitor', 'truck'].includes(entry_type)) {
        const error: AppError = new Error('Invalid entry type. Must be vehicle, visitor, or truck');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }
      updates.push(`entry_type = $${paramCount++}`);
      params.push(entry_type);
    }

    if (entry_data) {
      // Validate entry data if entry_type is provided or use existing
      const targetEntryType = entry_type || existingEntry.entry_type;
      let validatedData;
      try {
        validatedData = validateEntryData(targetEntryType as EntryType, entry_data);
      } catch (validationError: any) {
        const error: AppError = new Error(validationError.message);
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }
      updates.push(`entry_data = $${paramCount++}`);
      params.push(JSON.stringify(validatedData));
    }

    if (photos !== undefined) {
      updates.push(`photos = $${paramCount++}`);
      params.push(JSON.stringify(photos || []));
    }

    if (updates.length === 0) {
      const error: AppError = new Error('No fields to update');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // updated_at is automatically updated by trigger

    params.push(id);
    const query = `UPDATE entries SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, params);
    const updatedEntry = result.rows[0];

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'update_entry',
        'entry',
        updatedEntry.id,
        JSON.stringify({
          entry_type: updatedEntry.entry_type,
          job_site_id: updatedEntry.job_site_id,
          updated_by: req.user.username,
          changes: {
            job_site_id: job_site_id ? 'changed' : undefined,
            entry_type: entry_type ? 'changed' : undefined,
            entry_data: entry_data ? 'changed' : undefined,
            photos: photos !== undefined ? 'changed' : undefined,
          },
        }),
      ]
    );

    logger.info(`Entry updated: ${updatedEntry.entry_type} (${updatedEntry.id}) by ${req.user.username}`);

    // Broadcast occupancy update if job site changed
    if (job_site_id && job_site_id !== existingEntry.job_site_id) {
      webSocketService.broadcastOccupancyUpdate(job_site_id).catch((err) => {
        logger.error('Error broadcasting occupancy update:', err);
      });
      webSocketService.broadcastOccupancyUpdate(existingEntry.job_site_id).catch((err) => {
        logger.error('Error broadcasting occupancy update:', err);
      });
    } else if (!job_site_id) {
      webSocketService.broadcastOccupancyUpdate(existingEntry.job_site_id).catch((err) => {
        logger.error('Error broadcasting occupancy update:', err);
      });
    }

    res.json({
      success: true,
      data: {
        entry: updatedEntry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete entry
 */
export const deleteEntry = async (
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

    // Get existing entry
    const existingResult = await pool.query('SELECT * FROM entries WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const error: AppError = new Error('Entry not found');
      error.statusCode = 404;
      error.code = 'ENTRY_NOT_FOUND';
      return next(error);
    }

    const existingEntry = existingResult.rows[0];

    // Check job site access (unless admin)
    if (req.user.role !== 'admin') {
      const jobSiteAccess = req.user.job_site_access || [];
      if (!jobSiteAccess.includes(existingEntry.job_site_id)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
    }

    // Delete entry
    await pool.query('DELETE FROM entries WHERE id = $1', [id]);

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'delete_entry',
        'entry',
        id,
        JSON.stringify({
          entry_type: existingEntry.entry_type,
          job_site_id: existingEntry.job_site_id,
          deleted_by: req.user.username,
        }),
      ]
    );

    logger.info(`Entry deleted: ${existingEntry.entry_type} (${id}) by ${req.user.username}`);

    // Broadcast occupancy update
    webSocketService.broadcastOccupancyUpdate(existingEntry.job_site_id).catch((err) => {
      logger.error('Error broadcasting occupancy update:', err);
    });

    res.json({
      success: true,
      message: 'Entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

