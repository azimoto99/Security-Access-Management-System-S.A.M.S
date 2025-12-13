import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import * as docusignService from '../services/docusignService';
import * as assignmentService from '../services/documentAssignmentService';
import pool from '../config/database';

/**
 * Initiate document signing
 */
export const initiateSigning = async (
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

    const { assignment_id } = req.body;

    if (!assignment_id) {
      const error: AppError = new Error('assignment_id is required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Get assignment
    const assignment = await assignmentService.getAssignmentById(assignment_id);
    if (!assignment) {
      const error: AppError = new Error('Assignment not found');
      error.statusCode = 404;
      error.code = 'ASSIGNMENT_NOT_FOUND';
      return next(error);
    }

    // Check if user has access
    if (req.user.role === 'employee' && assignment.employee_id !== req.user.id) {
      const error: AppError = new Error('Access denied');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    // Get document
    const documentResult = await pool.query('SELECT * FROM hr_documents WHERE id = $1', [assignment.document_id]);
    if (documentResult.rows.length === 0) {
      const error: AppError = new Error('Document not found');
      error.statusCode = 404;
      error.code = 'DOCUMENT_NOT_FOUND';
      return next(error);
    }

    const document = documentResult.rows[0];

    // Get employee info
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [assignment.employee_id]);
    if (userResult.rows.length === 0) {
      const error: AppError = new Error('Employee not found');
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      return next(error);
    }

    const employee = userResult.rows[0];

    // Generate return URL
    const returnUrl = `${req.protocol}://${req.get('host')}/api/hr/docusign/callback?assignment_id=${assignment_id}`;

    // Create envelope
    const { envelopeId, signingUrl } = await docusignService.createEnvelope(
      assignment_id,
      document.file_path,
      employee.username, // Using username as email for demo
      employee.username,
      returnUrl
    );

    res.json({
      success: true,
      data: {
        envelope_id: envelopeId,
        signing_url: signingUrl,
        assignment_id,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('DocuSign')) {
      const appError: AppError = new Error(`DocuSign error: ${error.message}`);
      appError.statusCode = 500;
      appError.code = 'DOCUSIGN_ERROR';
      return next(appError);
    }
    next(error);
  }
};

/**
 * DocuSign webhook handler
 */
export const webhookHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // DocuSign sends XML or JSON depending on configuration
    const eventData = req.body;

    // Process webhook event
    await docusignService.processWebhookEvent(eventData);

    // DocuSign expects a 200 response
    res.status(200).send('OK');
  } catch (error) {
    // Still return 200 to DocuSign to prevent retries
    res.status(200).send('OK');
    next(error);
  }
};

/**
 * Get signing status
 */
export const getSigningStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { assignment_id } = req.query;

    if (!assignment_id) {
      const error: AppError = new Error('assignment_id is required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Get signature record
    const result = await pool.query(
      `SELECT s.*, a.employee_id, a.status as assignment_status
       FROM document_signatures s
       JOIN document_assignments a ON s.assignment_id = a.id
       WHERE s.assignment_id = $1`,
      [assignment_id]
    );

    if (result.rows.length === 0) {
      const error: AppError = new Error('Signature record not found');
      error.statusCode = 404;
      error.code = 'SIGNATURE_NOT_FOUND';
      return next(error);
    }

    const signature = result.rows[0];

    // Check access
    if (req.user && req.user.role === 'employee' && signature.employee_id !== req.user.id) {
      const error: AppError = new Error('Access denied');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    res.json({
      success: true,
      data: {
        signature,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Callback handler after signing
 */
export const signingCallback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { assignment_id, event } = req.query;

    // Redirect to frontend with status
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/hr/documents?assignment_id=${assignment_id}&status=${event || 'completed'}`;

    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

