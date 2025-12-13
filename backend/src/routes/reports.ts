import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validator';
import Joi from 'joi';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole('admin'));

// Validation schemas
const generateReportSchema = Joi.object({
  job_site_id: Joi.string().uuid().optional(),
  date_from: Joi.string().required(),
  date_to: Joi.string().required(),
  entry_type: Joi.string().valid('vehicle', 'visitor', 'truck').optional(),
});

// Routes
router.post('/generate', validate(generateReportSchema), reportController.generateReport);
router.post('/export', validate(generateReportSchema), reportController.exportReport);
router.get('/export-entries', reportController.exportEntries);

export default router;





