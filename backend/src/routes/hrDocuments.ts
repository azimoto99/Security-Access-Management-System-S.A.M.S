import { Router } from 'express';
import * as hrDocumentController from '../controllers/hrDocumentController';
import * as assignmentController from '../controllers/documentAssignmentController';
import * as docusignController from '../controllers/docusignController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { uploadSingleHRDocument } from '../middleware/uploadHRDocument';
import { validate } from '../middleware/validator';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createDocumentSchema = Joi.object({
  title: Joi.string().required().min(1).max(255),
  description: Joi.string().optional(),
  document_type: Joi.string().valid('onboarding', 'policy', 'contract', 'other').required(),
  is_required: Joi.boolean().optional(),
});

const createAssignmentSchema = Joi.object({
  document_id: Joi.string().uuid().required(),
  employee_id: Joi.string().uuid().required(),
  due_date: Joi.date().optional(),
});

const bulkAssignmentSchema = Joi.object({
  document_id: Joi.string().uuid().required(),
  employee_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
  due_date: Joi.date().optional(),
});

// All routes require authentication
router.use(authenticateToken);

// HR Document routes
router.get('/documents', hrDocumentController.getAllHRDocuments);
router.get('/documents/:id', hrDocumentController.getHRDocumentById);
router.get('/documents/:id/download', hrDocumentController.downloadHRDocument);
router.post(
  '/documents',
  authorizeRole('admin'),
  uploadSingleHRDocument,
  validate(createDocumentSchema),
  hrDocumentController.createHRDocument
);
router.put('/documents/:id', authorizeRole('admin'), hrDocumentController.updateHRDocument);
router.delete('/documents/:id', authorizeRole('admin'), hrDocumentController.deleteHRDocument);

// Assignment routes
router.get('/assignments', assignmentController.getAllAssignments);
router.get('/assignments/employee', assignmentController.getEmployeeAssignments);
router.get('/assignments/:id', assignmentController.getAssignmentById);
router.post('/assignments', authorizeRole('admin'), validate(createAssignmentSchema), assignmentController.createAssignment);
router.post('/assignments/bulk', authorizeRole('admin'), validate(bulkAssignmentSchema), assignmentController.createBulkAssignments);

// DocuSign routes
router.post('/docusign/initiate', docusignController.initiateSigning);
router.get('/docusign/status', docusignController.getSigningStatus);
router.get('/docusign/callback', docusignController.signingCallback);
router.post('/docusign/webhook', docusignController.webhookHandler); // No auth for webhook

export default router;











