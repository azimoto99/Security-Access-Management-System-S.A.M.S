import { Response, NextFunction } from 'express';
import pool from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import type {
  EntryFieldConfig,
  CreateFieldConfigRequest,
  UpdateFieldConfigRequest,
} from '../types/customField';

// Default exit field configurations for each entry type
const DEFAULT_EXIT_FIELD_CONFIGS: Record<string, Array<Omit<CreateFieldConfigRequest, 'job_site_id'>>> = {
  vehicle: [],
  visitor: [],
  truck: [
    { entry_type: 'truck', field_key: 'exit_trailer_number', field_label: 'Exit Trailer Number', field_type: 'text', is_required: false, is_active: true, is_custom: false, display_order: 0 },
  ],
};

/**
 * Initialize default exit field configurations for a job site and entry type
 */
const initializeDefaultExitFields = async (jobSiteId: string, entryType: string): Promise<void> => {
  const defaults = DEFAULT_EXIT_FIELD_CONFIGS[entryType] || [];
  
  for (const field of defaults) {
    // Check if field already exists
    const existing = await pool.query(
      'SELECT id FROM exit_field_configs WHERE job_site_id = $1 AND entry_type = $2 AND field_key = $3',
      [jobSiteId, entryType, field.field_key]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO exit_field_configs (
          job_site_id, entry_type, field_key, field_label, field_type,
          is_required, is_active, is_custom, options, validation, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          jobSiteId,
          field.entry_type,
          field.field_key,
          field.field_label,
          field.field_type,
          field.is_required ?? false,
          field.is_active ?? true,
          field.is_custom ?? false,
          JSON.stringify(field.options || []),
          JSON.stringify(field.validation || {}),
          field.display_order ?? 0,
        ]
      );
    }
  }
};

/**
 * Get all exit field configurations for a job site (both standard and custom)
 */
export const getExitFields = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { job_site_id, entry_type } = req.query;

    if (!job_site_id) {
      const error: AppError = new Error('job_site_id is required');
      error.statusCode = 400;
      error.code = 'MISSING_JOB_SITE_ID';
      return next(error);
    }

    // Initialize default fields if they don't exist
    if (entry_type) {
      await initializeDefaultExitFields(job_site_id as string, entry_type as string);
    } else {
      // Initialize for all entry types
      await Promise.all([
        initializeDefaultExitFields(job_site_id as string, 'vehicle'),
        initializeDefaultExitFields(job_site_id as string, 'visitor'),
        initializeDefaultExitFields(job_site_id as string, 'truck'),
      ]);
    }

    let query = 'SELECT * FROM exit_field_configs WHERE job_site_id = $1';
    const params: any[] = [job_site_id];

    if (entry_type) {
      query += ' AND entry_type = $2';
      params.push(entry_type);
    }

    query += ' ORDER BY entry_type, display_order, field_label';

    const result = await pool.query(query, params);

    // Parse JSONB fields
    const fieldConfigs = result.rows.map((row) => ({
      ...row,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options || [],
      validation: typeof row.validation === 'string' ? JSON.parse(row.validation) : row.validation || {},
    }));

    res.json({
      success: true,
      data: {
        exitFields: fieldConfigs,
        fieldConfigs, // Alias for consistency
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new exit field configuration
 */
export const createExitField = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data: CreateFieldConfigRequest = req.body;

    // Validate required fields
    if (!data.job_site_id || !data.entry_type || !data.field_key || !data.field_label || !data.field_type) {
      const error: AppError = new Error('job_site_id, entry_type, field_key, field_label, and field_type are required');
      error.statusCode = 400;
      error.code = 'MISSING_REQUIRED_FIELDS';
      return next(error);
    }

    // Validate field_key format
    if (!/^[a-z][a-z0-9_]*$/.test(data.field_key)) {
      const error: AppError = new Error('field_key must start with a letter and contain only lowercase letters, numbers, and underscores');
      error.statusCode = 400;
      error.code = 'INVALID_FIELD_KEY';
      return next(error);
    }

    // Check if field_key already exists
    const existingCheck = await pool.query(
      'SELECT id FROM exit_field_configs WHERE job_site_id = $1 AND entry_type = $2 AND field_key = $3',
      [data.job_site_id, data.entry_type, data.field_key]
    );

    if (existingCheck.rows.length > 0) {
      const error: AppError = new Error('An exit field with this key already exists for this job site and entry type');
      error.statusCode = 409;
      error.code = 'FIELD_KEY_EXISTS';
      return next(error);
    }

    // Verify job site exists
    const jobSiteCheck = await pool.query('SELECT id FROM job_sites WHERE id = $1', [data.job_site_id]);
    if (jobSiteCheck.rows.length === 0) {
      const error: AppError = new Error('Job site not found');
      error.statusCode = 404;
      error.code = 'JOB_SITE_NOT_FOUND';
      return next(error);
    }

    const result = await pool.query(
      `INSERT INTO exit_field_configs (
        job_site_id, entry_type, field_key, field_label, field_type,
        is_required, is_active, is_custom, options, validation, display_order,
        placeholder, help_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.job_site_id,
        data.entry_type,
        data.field_key,
        data.field_label,
        data.field_type,
        data.is_required ?? false,
        data.is_active ?? true,
        data.is_custom ?? true,
        JSON.stringify(data.options || []),
        JSON.stringify(data.validation || {}),
        data.display_order ?? 0,
        data.placeholder || null,
        data.help_text || null,
      ]
    );

    const field = result.rows[0];
    field.options = typeof field.options === 'string' ? JSON.parse(field.options) : field.options || [];
    field.validation = typeof field.validation === 'string' ? JSON.parse(field.validation) : field.validation || {};

    logger.info(`Exit field created: ${field.id} for job site ${data.job_site_id}`);

    res.status(201).json({
      success: true,
      data: {
        exitField: field,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an exit field configuration
 */
export const updateExitField = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data: UpdateFieldConfigRequest = req.body;

    // Check if field exists
    const existingCheck = await pool.query('SELECT * FROM exit_field_configs WHERE id = $1', [id]);
    if (existingCheck.rows.length === 0) {
      const error: AppError = new Error('Exit field not found');
      error.statusCode = 404;
      error.code = 'EXIT_FIELD_NOT_FOUND';
      return next(error);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (data.field_label !== undefined) {
      updates.push(`field_label = $${paramCount++}`);
      params.push(data.field_label);
    }
    if (data.field_type !== undefined) {
      updates.push(`field_type = $${paramCount++}`);
      params.push(data.field_type);
    }
    if (data.is_required !== undefined) {
      updates.push(`is_required = $${paramCount++}`);
      params.push(data.is_required);
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      params.push(data.is_active);
    }
    if (data.options !== undefined) {
      updates.push(`options = $${paramCount++}`);
      params.push(JSON.stringify(data.options));
    }
    if (data.validation !== undefined) {
      updates.push(`validation = $${paramCount++}`);
      params.push(JSON.stringify(data.validation));
    }
    if (data.display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      params.push(data.display_order);
    }
    if (data.placeholder !== undefined) {
      updates.push(`placeholder = $${paramCount++}`);
      params.push(data.placeholder || null);
    }
    if (data.help_text !== undefined) {
      updates.push(`help_text = $${paramCount++}`);
      params.push(data.help_text || null);
    }

    if (updates.length === 0) {
      const error: AppError = new Error('No fields to update');
      error.statusCode = 400;
      error.code = 'NO_UPDATE_FIELDS';
      return next(error);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `UPDATE exit_field_configs SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, params);

    const field = result.rows[0];
    field.options = typeof field.options === 'string' ? JSON.parse(field.options) : field.options || [];
    field.validation = typeof field.validation === 'string' ? JSON.parse(field.validation) : field.validation || {};

    logger.info(`Exit field updated: ${id}`);

    res.json({
      success: true,
      data: {
        exitField: field,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an exit field configuration
 */
export const deleteExitField = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM exit_field_configs WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      const error: AppError = new Error('Exit field not found');
      error.statusCode = 404;
      error.code = 'EXIT_FIELD_NOT_FOUND';
      return next(error);
    }

    logger.info(`Exit field deleted: ${id}`);

    res.json({
      success: true,
      message: 'Exit field deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

