import pool from '../config/database';
import { logger } from '../utils/logger';
import { createAuditLog } from './auditLogService';
import path from 'path';
import fs from 'fs/promises';

export interface HRDocument {
  id: string;
  title: string;
  description?: string;
  document_type: 'onboarding' | 'policy' | 'contract' | 'other';
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_required: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  created_by_username?: string;
}

export interface CreateHRDocumentData {
  title: string;
  description?: string;
  document_type: 'onboarding' | 'policy' | 'contract' | 'other';
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_required?: boolean;
}

export interface UpdateHRDocumentData {
  title?: string;
  description?: string;
  document_type?: 'onboarding' | 'policy' | 'contract' | 'other';
  is_required?: boolean;
  is_active?: boolean;
}

/**
 * Get all HR documents
 */
export const getAllHRDocuments = async (activeOnly: boolean = false): Promise<HRDocument[]> => {
  let query = `
    SELECT d.*, u.username as created_by_username
    FROM hr_documents d
    LEFT JOIN users u ON d.created_by = u.id
  `;

  if (activeOnly) {
    query += ' WHERE d.is_active = true';
  }

  query += ' ORDER BY d.created_at DESC';

  const result = await pool.query(query);
  return result.rows;
};

/**
 * Get HR document by ID
 */
export const getHRDocumentById = async (id: string): Promise<HRDocument | null> => {
  const result = await pool.query(
    `SELECT d.*, u.username as created_by_username
     FROM hr_documents d
     LEFT JOIN users u ON d.created_by = u.id
     WHERE d.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

/**
 * Create HR document
 */
export const createHRDocument = async (
  userId: string,
  data: CreateHRDocumentData
): Promise<HRDocument> => {
  const result = await pool.query(
    `INSERT INTO hr_documents (title, description, document_type, file_path, file_name, file_size, mime_type, is_required, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.title,
      data.description || null,
      data.document_type,
      data.file_path,
      data.file_name,
      data.file_size,
      data.mime_type,
      data.is_required || false,
      userId,
    ]
  );

  const document = result.rows[0];

  // Log action
  await createAuditLog(
    userId,
    'create_hr_document',
    'hr_document',
    document.id,
    { title: document.title, document_type: document.document_type }
  );

  logger.info(`HR document created: ${document.title} (${document.id}) by user ${userId}`);

  return document;
};

/**
 * Update HR document
 */
export const updateHRDocument = async (
  id: string,
  userId: string,
  data: UpdateHRDocumentData
): Promise<HRDocument> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.title !== undefined) {
    updates.push(`title = $${paramCount++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(data.description || null);
  }
  if (data.document_type !== undefined) {
    updates.push(`document_type = $${paramCount++}`);
    values.push(data.document_type);
  }
  if (data.is_required !== undefined) {
    updates.push(`is_required = $${paramCount++}`);
    values.push(data.is_required);
  }
  if (data.is_active !== undefined) {
    updates.push(`is_active = $${paramCount++}`);
    values.push(data.is_active);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `UPDATE hr_documents SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new Error('HR document not found');
  }

  const document = result.rows[0];

  // Log action
  await createAuditLog(
    userId,
    'update_hr_document',
    'hr_document',
    document.id,
    { title: document.title }
  );

  logger.info(`HR document updated: ${document.title} (${document.id}) by user ${userId}`);

  return document;
};

/**
 * Delete HR document
 */
export const deleteHRDocument = async (id: string, userId: string): Promise<void> => {
  // Get document to delete file
  const documentResult = await pool.query('SELECT * FROM hr_documents WHERE id = $1', [id]);
  if (documentResult.rows.length === 0) {
    throw new Error('HR document not found');
  }

  const document = documentResult.rows[0];

  // Delete file from filesystem
  try {
    const fullPath = path.join(process.cwd(), document.file_path);
    await fs.unlink(fullPath);
  } catch (error) {
    logger.warn(`Failed to delete file ${document.file_path}:`, error);
    // Continue with database deletion even if file deletion fails
  }

  // Delete from database (CASCADE will handle assignments and signatures)
  await pool.query('DELETE FROM hr_documents WHERE id = $1', [id]);

  // Log action
  await createAuditLog(
    userId,
    'delete_hr_document',
    'hr_document',
    id,
    { title: document.title }
  );

  logger.info(`HR document deleted: ${document.title} (${document.id}) by user ${userId}`);
};

/**
 * Get document file path
 */
export const getDocumentFilePath = async (id: string): Promise<string | null> => {
  const result = await pool.query('SELECT file_path FROM hr_documents WHERE id = $1 AND is_active = true', [id]);
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0].file_path;
};
















