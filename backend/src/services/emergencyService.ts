import pool from '../config/database';
import { logger } from '../utils/logger';
import { webSocketService } from './websocketService';
import { occupancyService } from './occupancyService';
import { createAuditLog } from './auditLogService';

export interface EmergencyMode {
  id: string;
  job_site_id?: string;
  activated_by: string;
  activated_at: Date;
  deactivated_by?: string;
  deactivated_at?: Date;
  reason?: string;
  actions_taken: any[];
  summary_report?: string;
  is_active: boolean;
  activated_by_username?: string;
  deactivated_by_username?: string;
  job_site_name?: string;
}

export interface CreateEmergencyModeData {
  job_site_id?: string;
  reason?: string;
}

export interface EmergencyAction {
  type: string;
  description: string;
  timestamp: Date;
  user_id: string;
  entry_id?: string;
}

/**
 * Check if emergency mode is active
 */
export const isEmergencyModeActive = async (jobSiteId?: string): Promise<boolean> => {
  let query = 'SELECT COUNT(*) FROM emergency_mode WHERE is_active = true';
  const values: any[] = [];

  if (jobSiteId) {
    query += ' AND (job_site_id = $1 OR job_site_id IS NULL)';
    values.push(jobSiteId);
  }

  const result = await pool.query(query, values);
  return parseInt(result.rows[0].count) > 0;
};

/**
 * Get active emergency modes
 */
export const getActiveEmergencyModes = async (): Promise<EmergencyMode[]> => {
  const result = await pool.query(
    `SELECT em.*, 
            u1.username as activated_by_username,
            u2.username as deactivated_by_username,
            js.name as job_site_name
     FROM emergency_mode em
     LEFT JOIN users u1 ON em.activated_by = u1.id
     LEFT JOIN users u2 ON em.deactivated_by = u2.id
     LEFT JOIN job_sites js ON em.job_site_id = js.id
     WHERE em.is_active = true
     ORDER BY em.activated_at DESC`
  );

  return result.rows.map((row) => ({
    ...row,
    actions_taken: typeof row.actions_taken === 'string' ? JSON.parse(row.actions_taken) : row.actions_taken,
  }));
};

/**
 * Activate emergency mode
 */
export const activateEmergencyMode = async (
  userId: string,
  data: CreateEmergencyModeData
): Promise<EmergencyMode> => {
  // Check if emergency mode is already active
  const isActive = await isEmergencyModeActive(data.job_site_id);
  if (isActive) {
    throw new Error('Emergency mode is already active');
  }

  const result = await pool.query(
    `INSERT INTO emergency_mode (job_site_id, activated_by, reason)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.job_site_id || null, userId, data.reason || null]
  );

  const emergencyMode = result.rows[0];

  // Log action
  await createAuditLog(
    userId,
    'activate_emergency_mode',
    'emergency_mode',
    emergencyMode.id,
    {
      job_site_id: data.job_site_id,
      reason: data.reason,
    }
  );

  // Get full details
  const fullResult = await pool.query(
    `SELECT em.*, 
            u1.username as activated_by_username,
            js.name as job_site_name
     FROM emergency_mode em
     LEFT JOIN users u1 ON em.activated_by = u1.id
     LEFT JOIN job_sites js ON em.job_site_id = js.id
     WHERE em.id = $1`,
    [emergencyMode.id]
  );

  const fullEmergencyMode = {
    ...fullResult.rows[0],
    actions_taken: typeof fullResult.rows[0].actions_taken === 'string' 
      ? JSON.parse(fullResult.rows[0].actions_taken) 
      : fullResult.rows[0].actions_taken,
  };

  logger.warn(`Emergency mode activated: ${emergencyMode.id} by user ${userId}`);

  // Broadcast emergency mode activation
  webSocketService.broadcastEmergencyMode({
    type: 'emergency_activated',
    emergency_mode: fullEmergencyMode,
    timestamp: new Date().toISOString(),
  });

  return fullEmergencyMode;
};

/**
 * Deactivate emergency mode
 */
export const deactivateEmergencyMode = async (
  emergencyModeId: string,
  userId: string,
  summaryReport?: string
): Promise<EmergencyMode> => {
  // Get current emergency mode
  const currentResult = await pool.query(
    'SELECT * FROM emergency_mode WHERE id = $1 AND is_active = true',
    [emergencyModeId]
  );

  if (currentResult.rows.length === 0) {
    throw new Error('Emergency mode not found or already deactivated');
  }

  const current = currentResult.rows[0];
  const actionsTaken = typeof current.actions_taken === 'string' 
    ? JSON.parse(current.actions_taken) 
    : current.actions_taken;

  // Update emergency mode
  const result = await pool.query(
    `UPDATE emergency_mode
     SET is_active = false,
         deactivated_by = $1,
         deactivated_at = CURRENT_TIMESTAMP,
         summary_report = $2
     WHERE id = $3
     RETURNING *`,
    [userId, summaryReport || null, emergencyModeId]
  );

  const emergencyMode = result.rows[0];

  // Log action
  await createAuditLog(
    userId,
    'deactivate_emergency_mode',
    'emergency_mode',
    emergencyMode.id,
    {
      actions_taken: actionsTaken.length,
      summary_report: summaryReport ? 'provided' : 'not provided',
    }
  );

  // Get full details
  const fullResult = await pool.query(
    `SELECT em.*, 
            u1.username as activated_by_username,
            u2.username as deactivated_by_username,
            js.name as job_site_name
     FROM emergency_mode em
     LEFT JOIN users u1 ON em.activated_by = u1.id
     LEFT JOIN users u2 ON em.deactivated_by = u2.id
     LEFT JOIN job_sites js ON em.job_site_id = js.id
     WHERE em.id = $1`,
    [emergencyMode.id]
  );

  const fullEmergencyMode = {
    ...fullResult.rows[0],
    actions_taken: typeof fullResult.rows[0].actions_taken === 'string' 
      ? JSON.parse(fullResult.rows[0].actions_taken) 
      : fullResult.rows[0].actions_taken,
  };

  logger.info(`Emergency mode deactivated: ${emergencyMode.id} by user ${userId}`);

  // Broadcast emergency mode deactivation
  webSocketService.broadcastEmergencyMode({
    type: 'emergency_deactivated',
    emergency_mode: fullEmergencyMode,
    timestamp: new Date().toISOString(),
  });

  return fullEmergencyMode;
};

/**
 * Record emergency action
 */
export const recordEmergencyAction = async (
  emergencyModeId: string,
  action: EmergencyAction
): Promise<void> => {
  const currentResult = await pool.query(
    'SELECT actions_taken FROM emergency_mode WHERE id = $1 AND is_active = true',
    [emergencyModeId]
  );

  if (currentResult.rows.length === 0) {
    throw new Error('Emergency mode not found or not active');
  }

  const current = currentResult.rows[0];
  const actionsTaken = typeof current.actions_taken === 'string' 
    ? JSON.parse(current.actions_taken) 
    : current.actions_taken;

  actionsTaken.push(action);

  await pool.query(
    'UPDATE emergency_mode SET actions_taken = $1 WHERE id = $2',
    [JSON.stringify(actionsTaken), emergencyModeId]
  );
};

/**
 * Process bulk exit for emergency
 */
export const processBulkExit = async (
  emergencyModeId: string,
  jobSiteId: string,
  userId: string,
  entryIds?: string[]
): Promise<{ exited_count: number; entries: any[] }> => {
  // Verify emergency mode is active
  const isActive = await isEmergencyModeActive(jobSiteId);
  if (!isActive) {
    throw new Error('Emergency mode is not active');
  }

  let query = `
    UPDATE entries
    SET exit_time = CURRENT_TIMESTAMP,
        status = 'emergency_exit'
    WHERE job_site_id = $1
    AND status = 'active'
  `;
  const values: any[] = [jobSiteId];

  if (entryIds && entryIds.length > 0) {
    query += ` AND id = ANY($2::uuid[])`;
    values.push(entryIds);
  }

  query += ' RETURNING *';

  const result = await pool.query(query, values);
  const exitedEntries = result.rows;

  // Record emergency action
  await recordEmergencyAction(emergencyModeId, {
    type: 'bulk_exit',
    description: `Bulk exit processed: ${exitedEntries.length} entries`,
    timestamp: new Date(),
    user_id: userId,
  });

  // Log action
  await createAuditLog(
    userId,
    'emergency_bulk_exit',
    'emergency_mode',
    emergencyModeId,
    {
      job_site_id: jobSiteId,
      exited_count: exitedEntries.length,
      entry_ids: entryIds || 'all',
    }
  );

  // Broadcast occupancy update
  webSocketService.broadcastOccupancyUpdate(jobSiteId).catch((err) => {
    logger.error('Error broadcasting occupancy update:', err);
  });

  logger.warn(`Emergency bulk exit: ${exitedEntries.length} entries exited at job site ${jobSiteId}`);

  return {
    exited_count: exitedEntries.length,
    entries: exitedEntries,
  };
};

/**
 * Get emergency mode history
 */
export const getEmergencyModeHistory = async (
  limit: number = 50,
  offset: number = 0
): Promise<{ emergency_modes: EmergencyMode[]; total: number }> => {
  // Get total count
  const countResult = await pool.query('SELECT COUNT(*) FROM emergency_mode');
  const total = parseInt(countResult.rows[0].count);

  // Get emergency modes
  const result = await pool.query(
    `SELECT em.*, 
            u1.username as activated_by_username,
            u2.username as deactivated_by_username,
            js.name as job_site_name
     FROM emergency_mode em
     LEFT JOIN users u1 ON em.activated_by = u1.id
     LEFT JOIN users u2 ON em.deactivated_by = u2.id
     LEFT JOIN job_sites js ON em.job_site_id = js.id
     ORDER BY em.activated_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const emergencyModes = result.rows.map((row) => ({
    ...row,
    actions_taken: typeof row.actions_taken === 'string' ? JSON.parse(row.actions_taken) : row.actions_taken,
  }));

  return { emergency_modes: emergencyModes, total };
};















