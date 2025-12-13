import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import * as assignmentService from '../services/documentAssignmentService';

/**
 * Get employee assignments
 */
export const getEmployeeAssignments = async (
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

    // Employees can only see their own assignments
    const employeeId = req.user.role === 'employee' ? req.user.id : req.query.employee_id || req.user.id;
    const assignments = await assignmentService.getEmployeeAssignments(employeeId as string);

    res.json({
      success: true,
      data: {
        assignments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all assignments (admin only)
 */
export const getAllAssignments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { document_id, employee_id, status } = req.query;

    const assignments = await assignmentService.getAllAssignments({
      document_id: document_id as string,
      employee_id: employee_id as string,
      status: status as string,
    });

    res.json({
      success: true,
      data: {
        assignments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignment by ID
 */
export const getAssignmentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await assignmentService.getAssignmentById(id);

    if (!assignment) {
      const error: AppError = new Error('Assignment not found');
      error.statusCode = 404;
      error.code = 'ASSIGNMENT_NOT_FOUND';
      return next(error);
    }

    // Check if user has access
    if (req.user && req.user.role === 'employee' && assignment.employee_id !== req.user.id) {
      const error: AppError = new Error('Access denied');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    res.json({
      success: true,
      data: {
        assignment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create assignment
 */
export const createAssignment = async (
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

    const { document_id, employee_id, due_date } = req.body;

    if (!document_id || !employee_id) {
      const error: AppError = new Error('document_id and employee_id are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const assignment = await assignmentService.createAssignment(req.user.id, {
      document_id,
      employee_id,
      due_date: due_date ? new Date(due_date) : undefined,
    });

    res.status(201).json({
      success: true,
      data: {
        assignment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create bulk assignments
 */
export const createBulkAssignments = async (
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

    const { document_id, employee_ids, due_date } = req.body;

    if (!document_id || !employee_ids || !Array.isArray(employee_ids)) {
      const error: AppError = new Error('document_id and employee_ids array are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const assignments = await assignmentService.createBulkAssignments(req.user.id, {
      document_id,
      employee_ids,
      due_date: due_date ? new Date(due_date) : undefined,
    });

    res.status(201).json({
      success: true,
      data: {
        assignments,
      },
      message: `${assignments.length} assignments created successfully`,
    });
  } catch (error) {
    next(error);
  }
};


