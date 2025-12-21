import pool from '../config/database';
import { logger } from '../utils/logger';
import { createAuditLog } from './auditLogService';

export interface DocumentAssignment {
  id: string;
  document_id: string;
  employee_id: string;
  assigned_by: string;
  assigned_at: Date;
  due_date?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'declined' | 'expired';
  completed_at?: Date;
  document_title?: string;
  employee_username?: string;
  assigned_by_username?: string;
}

export interface CreateAssignmentData {
  document_id: string;
  employee_id: string;
  due_date?: Date;
}

export interface BulkAssignmentData {
  document_id: string;
  employee_ids: string[];
  due_date?: Date;
}

/**
 * Get assignments for an employee
 */
export const getEmployeeAssignments = async (employeeId: string): Promise<DocumentAssignment[]> => {
  const result = await pool.query(
    `SELECT a.*, d.title as document_title, u1.username as employee_username, u2.username as assigned_by_username
     FROM document_assignments a
     JOIN hr_documents d ON a.document_id = d.id
     LEFT JOIN users u1 ON a.employee_id = u1.id
     LEFT JOIN users u2 ON a.assigned_by = u2.id
     WHERE a.employee_id = $1
     ORDER BY a.assigned_at DESC`,
    [employeeId]
  );

  return result.rows;
};

/**
 * Get all assignments (admin view)
 */
export const getAllAssignments = async (filters: {
  document_id?: string;
  employee_id?: string;
  status?: string;
}): Promise<DocumentAssignment[]> => {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (filters.document_id) {
    conditions.push(`a.document_id = $${paramCount++}`);
    values.push(filters.document_id);
  }

  if (filters.employee_id) {
    conditions.push(`a.employee_id = $${paramCount++}`);
    values.push(filters.employee_id);
  }

  if (filters.status) {
    conditions.push(`a.status = $${paramCount++}`);
    values.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT a.*, d.title as document_title, u1.username as employee_username, u2.username as assigned_by_username
     FROM document_assignments a
     JOIN hr_documents d ON a.document_id = d.id
     LEFT JOIN users u1 ON a.employee_id = u1.id
     LEFT JOIN users u2 ON a.assigned_by = u2.id
     ${whereClause}
     ORDER BY a.assigned_at DESC`,
    values
  );

  return result.rows;
};

/**
 * Get assignment by ID
 */
export const getAssignmentById = async (id: string): Promise<DocumentAssignment | null> => {
  const result = await pool.query(
    `SELECT a.*, d.title as document_title, u1.username as employee_username, u2.username as assigned_by_username
     FROM document_assignments a
     JOIN hr_documents d ON a.document_id = d.id
     LEFT JOIN users u1 ON a.employee_id = u1.id
     LEFT JOIN users u2 ON a.assigned_by = u2.id
     WHERE a.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

/**
 * Create document assignment
 */
export const createAssignment = async (
  userId: string,
  data: CreateAssignmentData
): Promise<DocumentAssignment> => {
  const result = await pool.query(
    `INSERT INTO document_assignments (document_id, employee_id, assigned_by, due_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.document_id, data.employee_id, userId, data.due_date || null]
  );

  const assignment = result.rows[0];

  // Log action
  await createAuditLog(
    userId,
    'assign_hr_document',
    'document_assignment',
    assignment.id,
    { document_id: data.document_id, employee_id: data.employee_id }
  );

  logger.info(`Document assigned: ${assignment.id} by user ${userId}`);

  // Get full assignment details
  const fullAssignment = await getAssignmentById(assignment.id);
  return fullAssignment!;
};

/**
 * Create bulk assignments
 */
export const createBulkAssignments = async (
  userId: string,
  data: BulkAssignmentData
): Promise<DocumentAssignment[]> => {
  const assignments: DocumentAssignment[] = [];

  for (const employeeId of data.employee_ids) {
    const assignment = await createAssignment(userId, {
      document_id: data.document_id,
      employee_id: employeeId,
      due_date: data.due_date,
    });
    assignments.push(assignment);
  }

  logger.info(`Bulk assignment created: ${assignments.length} assignments for document ${data.document_id}`);

  return assignments;
};

/**
 * Update assignment status
 */
export const updateAssignmentStatus = async (
  id: string,
  status: 'pending' | 'in_progress' | 'completed' | 'declined' | 'expired',
  completedAt?: Date
): Promise<DocumentAssignment> => {
  const result = await pool.query(
    `UPDATE document_assignments
     SET status = $1, completed_at = $2
     WHERE id = $3
     RETURNING *`,
    [status, completedAt || null, id]
  );

  if (result.rows.length === 0) {
    throw new Error('Assignment not found');
  }

  const assignment = result.rows[0];

  // Get full assignment details
  const fullAssignment = await getAssignmentById(assignment.id);
  return fullAssignment!;
};

/**
 * Check and update onboarding status
 */
export const checkOnboardingStatus = async (employeeId: string): Promise<void> => {
  // Get all required assignments for this employee
  const result = await pool.query(
    `SELECT a.*, d.is_required
     FROM document_assignments a
     JOIN hr_documents d ON a.document_id = d.id
     WHERE a.employee_id = $1 AND d.is_required = true`,
    [employeeId]
  );

  const requiredAssignments = result.rows;

  if (requiredAssignments.length === 0) {
    return; // No required documents
  }

  // Check if all required documents are completed
  const allCompleted = requiredAssignments.every((a) => a.status === 'completed');

  if (allCompleted) {
    // Update user onboarding status
    await pool.query(
      "UPDATE users SET onboarding_status = 'completed' WHERE id = $1",
      [employeeId]
    );
    logger.info(`Onboarding completed for employee ${employeeId}`);
  } else {
    // Check if any are in progress
    const hasInProgress = requiredAssignments.some((a) => a.status === 'in_progress');
    if (hasInProgress) {
      await pool.query(
        "UPDATE users SET onboarding_status = 'in_progress' WHERE id = $1",
        [employeeId]
      );
    }
  }
};








