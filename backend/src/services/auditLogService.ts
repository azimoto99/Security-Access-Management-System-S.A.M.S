import pool from '../config/database';
import { logger } from '../utils/logger';

export interface AuditLog {
  id: string;
  user_id: string;
  username?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface AuditLogFilters {
  user_id?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  job_site_ids?: string[]; // For filtering by accessible job sites (guards)
  is_client?: boolean; // Flag to indicate if this is a client request (for stricter filtering)
}

/**
 * Create audit log entry
 */
export const createAuditLog = async (
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, resourceType, resourceId, JSON.stringify(details || {})]
    );
  } catch (error) {
    logger.error('Error creating audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
};

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (filters: AuditLogFilters = {}): Promise<{
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const {
      user_id,
      action,
      resource_type,
      resource_id,
      date_from,
      date_to,
      page = 1,
      limit = 50,
    } = filters;

    // Build base query - need to join with entries if filtering by job sites
    const needsJobSiteFilter = filters.job_site_ids && filters.job_site_ids.length > 0;
    // For clients, only show entry and job_site logs (exclude admin actions)
    const isClientFilter = filters.is_client === true;
    
    let query = `
      SELECT ${needsJobSiteFilter ? 'DISTINCT' : ''}
        al.*,
        u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${needsJobSiteFilter ? 'LEFT JOIN entries e ON al.resource_type = \'entry\' AND al.resource_id IS NOT NULL AND al.resource_id::text = e.id::text' : ''}
      ${needsJobSiteFilter ? 'LEFT JOIN job_sites js ON al.resource_type = \'job_site\' AND al.resource_id IS NOT NULL AND al.resource_id::text = js.id::text' : ''}
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    // Filter by job site access for guards and clients
    // For clients: ONLY show entry and job_site logs related to their sites (exclude admin actions)
    // For guards: Show entry and job_site logs related to their sites, but also allow other resource types
    if (needsJobSiteFilter) {
      if (isClientFilter) {
        // Clients: ONLY entry and job_site logs for their sites
        query += ` AND (
          (al.resource_type = 'entry' AND e.job_site_id = ANY($${paramCount}))
          OR (al.resource_type = 'job_site' AND js.id = ANY($${paramCount}))
        )`;
      } else {
        // Guards: entry and job_site logs for their sites, plus other resource types
        query += ` AND (
          (al.resource_type = 'entry' AND e.job_site_id = ANY($${paramCount}))
          OR (al.resource_type = 'job_site' AND js.id = ANY($${paramCount}))
          OR (al.resource_type NOT IN ('entry', 'job_site'))
        )`;
      }
      params.push(filters.job_site_ids);
      paramCount++;
    }

    if (user_id) {
      query += ` AND al.user_id = $${paramCount++}::uuid`;
      params.push(user_id);
    }

    if (action) {
      query += ` AND al.action = $${paramCount++}`;
      params.push(action);
    }

    if (resource_type) {
      query += ` AND al.resource_type = $${paramCount++}`;
      params.push(resource_type);
    }

    if (resource_id) {
      query += ` AND al.resource_id = $${paramCount++}`;
      params.push(resource_id);
    }

    if (date_from) {
      query += ` AND al.timestamp >= $${paramCount++}`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND al.timestamp <= $${paramCount++}`;
      params.push(date_to);
    }

    // Get total count - build count query properly
    // Use subquery approach for better compatibility when using DISTINCT with JOINs
    let countQuery = needsJobSiteFilter
      ? `
        SELECT COUNT(DISTINCT al.id) as total
        FROM audit_logs al
        LEFT JOIN entries e ON al.resource_type = 'entry' AND al.resource_id IS NOT NULL AND al.resource_id::text = e.id::text
        LEFT JOIN job_sites js ON al.resource_type = 'job_site' AND al.resource_id IS NOT NULL AND al.resource_id::text = js.id::text
        WHERE 1=1
      `
      : `
        SELECT COUNT(*) as total
        FROM audit_logs al
        WHERE 1=1
      `;
    const countParams: any[] = [];
    let countParamCount = 1;

    // Apply same filters to count query
    if (needsJobSiteFilter) {
      if (isClientFilter) {
        // Clients: ONLY entry and job_site logs for their sites
        countQuery += ` AND (
          (al.resource_type = 'entry' AND e.job_site_id = ANY($${countParamCount}))
          OR (al.resource_type = 'job_site' AND js.id = ANY($${countParamCount}))
        )`;
      } else {
        // Guards: entry and job_site logs for their sites, plus other resource types
        countQuery += ` AND (
          (al.resource_type = 'entry' AND e.job_site_id = ANY($${countParamCount}))
          OR (al.resource_type = 'job_site' AND js.id = ANY($${countParamCount}))
          OR (al.resource_type NOT IN ('entry', 'job_site'))
        )`;
      }
      countParams.push(filters.job_site_ids);
      countParamCount++;
    }

    if (user_id) {
      countQuery += ` AND al.user_id = $${countParamCount++}::uuid`;
      countParams.push(user_id);
    }

    if (action) {
      countQuery += ` AND al.action = $${countParamCount++}`;
      countParams.push(action);
    }

    if (resource_type) {
      countQuery += ` AND al.resource_type = $${countParamCount++}`;
      countParams.push(resource_type);
    }

    if (resource_id) {
      countQuery += ` AND al.resource_id = $${countParamCount++}`;
      countParams.push(resource_id);
    }

    if (date_from) {
      countQuery += ` AND al.timestamp >= $${countParamCount++}`;
      countParams.push(date_from);
    }

    if (date_to) {
      countQuery += ` AND al.timestamp <= $${countParamCount++}`;
      countParams.push(date_to);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY al.timestamp DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const logs = result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      action: row.action,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      details: row.details,
      timestamp: row.timestamp,
    }));

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error('Error getting audit logs:', error);
    throw error;
  }
};






