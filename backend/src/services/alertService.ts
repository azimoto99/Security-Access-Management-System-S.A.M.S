import pool from '../config/database';
import { logger } from '../utils/logger';
import { occupancyService } from './occupancyService';
import { webSocketService } from './websocketService';

export type AlertType =
  | 'overstay'
  | 'capacity_warning'
  | 'watchlist_match'
  | 'invalid_exit'
  | 'failed_login'
  | 'account_locked';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  job_site_id?: string;
  entry_id?: string;
  watchlist_id?: string;
  user_id?: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: Date;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface CreateAlertData {
  type: AlertType;
  severity?: AlertSeverity;
  title: string;
  message: string;
  job_site_id?: string;
  entry_id?: string;
  watchlist_id?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new alert
 */
export const createAlert = async (data: CreateAlertData): Promise<Alert> => {
  const {
    type,
    severity = 'medium',
    title,
    message,
    job_site_id,
    entry_id,
    watchlist_id,
    user_id,
    metadata = {},
  } = data;

  const result = await pool.query(
    `INSERT INTO alerts (type, severity, title, message, job_site_id, entry_id, watchlist_id, user_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [type, severity, title, message, job_site_id || null, entry_id || null, watchlist_id || null, user_id || null, JSON.stringify(metadata)]
  );

  const alert = {
    ...result.rows[0],
    metadata: typeof result.rows[0].metadata === 'string' ? JSON.parse(result.rows[0].metadata) : result.rows[0].metadata,
  };

  logger.info(`Alert created: ${type} - ${title} (${alert.id})`);

  // Broadcast alert via WebSocket
  try {
    webSocketService.broadcastAlert(alert);
  } catch (err) {
    logger.error('Error broadcasting alert:', err);
    // Don't fail alert creation if broadcast fails
  }

  return alert;
};

/**
 * Get alerts with filtering
 */
export const getAlerts = async (filters: {
  type?: AlertType;
  severity?: AlertSeverity;
  job_site_id?: string;
  is_acknowledged?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ alerts: Alert[]; total: number }> => {
  const { type, severity, job_site_id, is_acknowledged, limit = 100, offset = 0 } = filters;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (type) {
    conditions.push(`type = $${paramCount++}`);
    values.push(type);
  }

  if (severity) {
    conditions.push(`severity = $${paramCount++}`);
    values.push(severity);
  }

  if (job_site_id) {
    conditions.push(`job_site_id = $${paramCount++}`);
    values.push(job_site_id);
  }

  if (is_acknowledged !== undefined) {
    conditions.push(`is_acknowledged = $${paramCount++}`);
    values.push(is_acknowledged);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await pool.query(`SELECT COUNT(*) FROM alerts ${whereClause}`, values);
  const total = parseInt(countResult.rows[0].count);

  // Get alerts
  values.push(limit, offset);
  const result = await pool.query(
    `SELECT * FROM alerts ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    values
  );

  const alerts = result.rows.map((row) => ({
    ...row,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
  }));

  return { alerts, total };
};

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = async (alertId: string, userId: string): Promise<Alert> => {
  const result = await pool.query(
    `UPDATE alerts
     SET is_acknowledged = true, acknowledged_by = $1, acknowledged_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [userId, alertId]
  );

  if (result.rows.length === 0) {
    throw new Error('Alert not found');
  }

  const alert = {
    ...result.rows[0],
    metadata: typeof result.rows[0].metadata === 'string' ? JSON.parse(result.rows[0].metadata) : result.rows[0].metadata,
  };

  logger.info(`Alert acknowledged: ${alertId} by user ${userId}`);
  return alert;
};

/**
 * Check for overstay alerts
 */
export const checkOverstays = async (): Promise<void> => {
  // Get all active entries older than expected duration
  // For visitors, expected duration is typically 4 hours, for vehicles 8 hours
  const result = await pool.query(
    `SELECT e.*, js.name as job_site_name
     FROM entries e
     JOIN job_sites js ON e.job_site_id = js.id
     WHERE e.status = 'active'
     AND e.entry_time < NOW() - INTERVAL '4 hours'
     AND NOT EXISTS (
       SELECT 1 FROM alerts a
       WHERE a.entry_id = e.id
       AND a.type = 'overstay'
       AND a.is_acknowledged = false
     )`
  );

  for (const entry of result.rows) {
    const entryData = typeof entry.entry_data === 'string' ? JSON.parse(entry.entry_data) : entry.entry_data;
    const hoursOverdue = Math.floor((Date.now() - new Date(entry.entry_time).getTime()) / (1000 * 60 * 60));

    let identifier = '';
    if (entry.entry_type === 'vehicle') {
      identifier = entryData.license_plate || 'Unknown';
    } else if (entry.entry_type === 'visitor') {
      identifier = entryData.name || 'Unknown';
    } else {
      identifier = entryData.license_plate || entryData.driver_name || 'Unknown';
    }

    await createAlert({
      type: 'overstay',
      severity: hoursOverdue > 8 ? 'high' : hoursOverdue > 4 ? 'medium' : 'low',
      title: `${entry.entry_type} Overstay Alert`,
      message: `${entry.entry_type} (${identifier}) has been on site for ${hoursOverdue} hours at ${entry.job_site_name}`,
      job_site_id: entry.job_site_id,
      entry_id: entry.id,
      metadata: {
        entry_type: entry.entry_type,
        identifier,
        hours_overdue: hoursOverdue,
        entry_time: entry.entry_time,
      },
    });
  }
};

/**
 * Check for capacity warnings
 */
export const checkCapacityWarnings = async (): Promise<void> => {
  const occupancies = await occupancyService.getOccupancies();

  for (const occupancy of occupancies) {
    const vehiclePercent = occupancy.vehicle_capacity > 0 ? (occupancy.vehicle_count / occupancy.vehicle_capacity) * 100 : 0;
    const visitorPercent = occupancy.visitor_capacity > 0 ? (occupancy.visitor_count / occupancy.visitor_capacity) * 100 : 0;
    const truckPercent = occupancy.truck_capacity > 0 ? (occupancy.truck_count / occupancy.truck_capacity) * 100 : 0;

    const maxPercent = Math.max(vehiclePercent, visitorPercent, truckPercent);

    if (maxPercent >= 90) {
      // Check if alert already exists
      const existingAlert = await pool.query(
        `SELECT id FROM alerts
         WHERE type = 'capacity_warning'
         AND job_site_id = $1
         AND is_acknowledged = false
         AND created_at > NOW() - INTERVAL '1 hour'`,
        [occupancy.job_site_id]
      );

      if (existingAlert.rows.length === 0) {
        const severity: AlertSeverity = maxPercent >= 95 ? 'high' : 'medium';
        await createAlert({
          type: 'capacity_warning',
          severity,
          title: `Capacity Warning: ${occupancy.job_site_name}`,
          message: `Site capacity is at ${maxPercent.toFixed(1)}%. Vehicles: ${occupancy.vehicle_count}/${occupancy.vehicle_capacity}, Visitors: ${occupancy.visitor_count}/${occupancy.visitor_capacity}, Trucks: ${occupancy.truck_count}/${occupancy.truck_capacity}`,
          job_site_id: occupancy.job_site_id,
          metadata: {
            vehicle_percent: vehiclePercent,
            visitor_percent: visitorPercent,
            truck_percent: truckPercent,
            vehicle_count: occupancy.vehicle_count,
            visitor_count: occupancy.visitor_count,
            truck_count: occupancy.truck_count,
            vehicle_capacity: occupancy.vehicle_capacity,
            visitor_capacity: occupancy.visitor_capacity,
            truck_capacity: occupancy.truck_capacity,
          },
        });
      }
    }
  }
};

/**
 * Check if entry matches watchlist
 */
export const checkWatchlistMatch = async (
  entryType: 'vehicle' | 'visitor' | 'truck',
  entryData: Record<string, any>,
  jobSiteId: string,
  entryId: string
): Promise<Alert | null> => {
  let identifier = '';
  if (entryType === 'vehicle' || entryType === 'truck') {
    identifier = entryData.license_plate?.toUpperCase().trim() || '';
  } else {
    identifier = entryData.name?.toUpperCase().trim() || '';
  }

  if (!identifier) {
    return null;
  }

  const watchlistType = entryType === 'visitor' ? 'person' : 'vehicle';

  const result = await pool.query(
    `SELECT * FROM watchlist
     WHERE type = $1
     AND UPPER(TRIM(identifier)) = $2
     AND is_active = true`,
    [watchlistType, identifier]
  );

  if (result.rows.length > 0) {
    const watchlistEntry = result.rows[0];
    const severity: AlertSeverity = watchlistEntry.alert_level === 'high' ? 'critical' : watchlistEntry.alert_level === 'medium' ? 'high' : 'medium';

    return await createAlert({
      type: 'watchlist_match',
      severity,
      title: `Watchlist Match: ${identifier}`,
      message: `${entryType} (${identifier}) matches watchlist entry. Reason: ${watchlistEntry.reason}`,
      job_site_id: jobSiteId,
      entry_id: entryId,
      watchlist_id: watchlistEntry.id,
      metadata: {
        entry_type: entryType,
        identifier,
        watchlist_reason: watchlistEntry.reason,
        watchlist_alert_level: watchlistEntry.alert_level,
      },
    });
  }

  return null;
};

/**
 * Record failed login attempt
 */
export const recordFailedLogin = async (
  username: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await pool.query(
    `INSERT INTO failed_login_attempts (username, ip_address, user_agent)
     VALUES ($1, $2, $3)`,
    [username, ipAddress || null, userAgent || null]
  );

  // Check for multiple failed attempts
  const recentAttempts = await pool.query(
    `SELECT COUNT(*) as count
     FROM failed_login_attempts
     WHERE username = $1
     AND attempted_at > NOW() - INTERVAL '15 minutes'`,
    [username]
  );

  const attemptCount = parseInt(recentAttempts.rows[0].count);

  if (attemptCount >= 5) {
    // Create alert for administrators
    await createAlert({
      type: 'failed_login',
      severity: 'high',
      title: `Multiple Failed Login Attempts: ${username}`,
      message: `User "${username}" has ${attemptCount} failed login attempts in the last 15 minutes from IP ${ipAddress || 'unknown'}`,
      metadata: {
        username,
        attempt_count: attemptCount,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });
  }
};

/**
 * Clear failed login attempts for a user
 */
export const clearFailedLoginAttempts = async (username: string): Promise<void> => {
  await pool.query('DELETE FROM failed_login_attempts WHERE username = $1', [username]);
};

