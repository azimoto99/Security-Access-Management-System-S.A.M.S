import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as reportService from '../services/reportService';
import { exportReportToCSV, exportEntriesToCSV } from '../utils/exportService';
import pool from '../config/database';

/**
 * Generate report
 */
export const generateReport = async (
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

    const { job_site_id, date_from, date_to, time_from, time_to, entry_type } = req.body;

    if (!date_from || !date_to) {
      const error: AppError = new Error('date_from and date_to are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Build datetime strings if time is provided
    // Convert to Central Time (Texas timezone: America/Chicago)
    let datetime_from = date_from;
    let datetime_to = date_to;
    
    if (time_from) {
      datetime_from = `${date_from} ${time_from}`;
    } else {
      datetime_from = `${date_from} 00:00:00`;
    }
    
    if (time_to) {
      datetime_to = `${date_to} ${time_to}`;
    } else {
      datetime_to = `${date_to} 23:59:59`;
    }

    // datetime_from and datetime_to will be interpreted as Central Time in the SQL query
    // The reportService will append ' America/Chicago' and convert to UTC for comparison

    // Check job site access if not admin
    // For clients and guards, ensure they can only access their assigned sites
    let allowedJobSiteId = job_site_id;
    if (req.user.role !== 'admin') {
      const jobSiteAccess = req.user.job_site_access || [];
      if (job_site_id) {
        if (!jobSiteAccess.includes(job_site_id)) {
          const error: AppError = new Error('Access denied to this job site');
          error.statusCode = 403;
          error.code = 'JOB_SITE_ACCESS_DENIED';
          return next(error);
        }
        allowedJobSiteId = job_site_id;
      } else {
        // If no job_site_id provided, clients/guards must select from their accessible sites
        // For now, if they have only one site, use it; otherwise require selection
        if (jobSiteAccess.length === 1) {
          allowedJobSiteId = jobSiteAccess[0];
        } else if (jobSiteAccess.length === 0) {
          const error: AppError = new Error('No job sites assigned');
          error.statusCode = 403;
          error.code = 'NO_JOB_SITE_ACCESS';
          return next(error);
        } else {
          const error: AppError = new Error('Job site selection required');
          error.statusCode = 400;
          error.code = 'JOB_SITE_REQUIRED';
          return next(error);
        }
      }
    }

    const filters = {
      job_site_id: allowedJobSiteId,
      date_from: datetime_from,
      date_to: datetime_to,
      entry_type,
    };

    const report = await reportService.generateReport(filters);

    res.json({
      success: true,
      data: {
        report,
        filters: {
          job_site_id: allowedJobSiteId,
          date_from,
          date_to,
          time_from,
          time_to,
          entry_type,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export report to CSV
 */
export const exportReport = async (
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

    const { job_site_id, date_from, date_to, time_from, time_to, entry_type } = req.body;

    if (!date_from || !date_to) {
      const error: AppError = new Error('date_from and date_to are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Build datetime strings if time is provided
    // Convert to Central Time (Texas timezone: America/Chicago)
    let datetime_from = date_from;
    let datetime_to = date_to;
    
    if (time_from) {
      datetime_from = `${date_from} ${time_from}`;
    } else {
      datetime_from = `${date_from} 00:00:00`;
    }
    
    if (time_to) {
      datetime_to = `${date_to} ${time_to}`;
    } else {
      datetime_to = `${date_to} 23:59:59`;
    }

    // datetime_from and datetime_to will be interpreted as Central Time in the SQL query
    // The reportService will append ' America/Chicago' and convert to UTC for comparison

    // Check job site access if not admin
    // For clients and guards, ensure they can only access their assigned sites
    let allowedJobSiteId = job_site_id;
    if (req.user.role !== 'admin') {
      const jobSiteAccess = req.user.job_site_access || [];
      if (job_site_id) {
        if (!jobSiteAccess.includes(job_site_id)) {
          const error: AppError = new Error('Access denied to this job site');
          error.statusCode = 403;
          error.code = 'JOB_SITE_ACCESS_DENIED';
          return next(error);
        }
        allowedJobSiteId = job_site_id;
      } else {
        // If no job_site_id provided, clients/guards must select from their accessible sites
        if (jobSiteAccess.length === 1) {
          allowedJobSiteId = jobSiteAccess[0];
        } else if (jobSiteAccess.length === 0) {
          const error: AppError = new Error('No job sites assigned');
          error.statusCode = 403;
          error.code = 'NO_JOB_SITE_ACCESS';
          return next(error);
        } else {
          const error: AppError = new Error('Job site selection required');
          error.statusCode = 400;
          error.code = 'JOB_SITE_REQUIRED';
          return next(error);
        }
      }
    }

    const filters = {
      job_site_id: allowedJobSiteId,
      date_from: datetime_from,
      date_to: datetime_to,
      entry_type,
    };

    const report = await reportService.generateReport(filters);
    const csv = exportReportToCSV(report, { ...filters, date_from, date_to, time_from, time_to });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * Export entries to CSV
 */
export const exportEntries = async (
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
      job_site_id,
      entry_type,
      status,
      license_plate,
      name,
      company,
      date_from,
      date_to,
      time_from,
      time_to,
    } = req.query;

    // Build datetime strings if time is provided
    // Convert to Central Time (Texas timezone: America/Chicago)
    let datetime_from = date_from as string;
    let datetime_to = date_to as string;
    
    if (date_from && time_from) {
      datetime_from = `${date_from} ${time_from}`;
    } else if (date_from) {
      datetime_from = `${date_from} 00:00:00`;
    }
    
    if (date_to && time_to) {
      datetime_to = `${date_to} ${time_to}`;
    } else if (date_to) {
      datetime_to = `${date_to} 23:59:59`;
    }

    // datetime_from and datetime_to are already in the correct format
    // They will be interpreted as Central Time in the query

    // Build query similar to searchEntries
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
    if (req.user.role !== 'admin') {
      const jobSiteAccess = req.user.job_site_access || [];
      if (job_site_id) {
        if (!jobSiteAccess.includes(job_site_id as string)) {
          const error: AppError = new Error('Access denied to this job site');
          error.statusCode = 403;
          error.code = 'JOB_SITE_ACCESS_DENIED';
          return next(error);
        }
        query += ` AND e.job_site_id = $${paramCount++}`;
        params.push(job_site_id);
      } else {
        // Filter by accessible job sites (non-admins only)
        query += ` AND e.job_site_id = ANY($${paramCount++})`;
        params.push(jobSiteAccess);
      }
    } else if (job_site_id) {
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

    if (datetime_from) {
      query += ` AND e.entry_time >= (($${paramCount++}::text || ' America/Chicago')::timestamptz AT TIME ZONE 'UTC')`;
      params.push(datetime_from);
    }

    if (datetime_to) {
      query += ` AND e.entry_time <= (($${paramCount++}::text || ' America/Chicago')::timestamptz AT TIME ZONE 'UTC')`;
      params.push(datetime_to);
    }

    if (license_plate) {
      query += ` AND e.entry_data->>'license_plate' ILIKE $${paramCount++}`;
      params.push(`%${license_plate}%`);
    }

    if (name) {
      query += ` AND (e.entry_data->>'name' ILIKE $${paramCount} OR e.entry_data->>'driver_name' ILIKE $${paramCount})`;
      params.push(`%${name}%`);
      paramCount++;
    }

    if (company) {
      query += ` AND e.entry_data->>'company' ILIKE $${paramCount++}`;
      params.push(`%${company}%`);
    }

    query += ' ORDER BY e.entry_time DESC';

    const result = await pool.query(query, params);
    const csv = exportEntriesToCSV(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=entries-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

