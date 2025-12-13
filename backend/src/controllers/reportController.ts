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
    const { job_site_id, date_from, date_to, entry_type } = req.body;

    if (!date_from || !date_to) {
      const error: AppError = new Error('date_from and date_to are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Check job site access if not admin
    if (req.user && req.user.role !== 'admin' && req.user.job_site_access) {
      if (job_site_id && !req.user.job_site_access.includes(job_site_id)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
    }

    const filters = {
      job_site_id,
      date_from,
      date_to,
      entry_type,
    };

    const report = await reportService.generateReport(filters);

    res.json({
      success: true,
      data: {
        report,
        filters,
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
    const { job_site_id, date_from, date_to, entry_type } = req.body;

    if (!date_from || !date_to) {
      const error: AppError = new Error('date_from and date_to are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const filters = {
      job_site_id,
      date_from,
      date_to,
      entry_type,
    };

    const report = await reportService.generateReport(filters);
    const csv = exportReportToCSV(report, filters);

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
    const {
      job_site_id,
      entry_type,
      status,
      license_plate,
      name,
      company,
      date_from,
      date_to,
    } = req.query;

    // Use the search entries functionality
    const searchParams: any = {
      page: '1',
      limit: '10000', // Large limit for export
    };

    if (job_site_id) searchParams.job_site_id = job_site_id;
    if (entry_type) searchParams.entry_type = entry_type;
    if (status) searchParams.status = status;
    if (license_plate) searchParams.license_plate = license_plate;
    if (name) searchParams.name = name;
    if (company) searchParams.company = company;
    if (date_from) searchParams.date_from = date_from;
    if (date_to) searchParams.date_to = date_to;

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

    if (date_from) {
      query += ` AND e.entry_time >= $${paramCount++}`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND e.entry_time <= $${paramCount++}`;
      params.push(date_to);
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

