import { Router } from 'express';
import * as entryController from '../controllers/entryController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validator';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createEntrySchema = Joi.object({
  job_site_id: Joi.string().uuid().required(),
  entry_type: Joi.string().valid('vehicle', 'visitor', 'truck').required(),
  entry_data: Joi.object().required(),
  photos: Joi.array().items(Joi.string()).optional(),
});

const exitEntrySchema = Joi.object({
  entry_id: Joi.string().uuid().required(),
  override: Joi.boolean().optional(),
  override_reason: Joi.string().optional(),
});

// Routes
router.post('/', validate(createEntrySchema), entryController.createEntry);
router.get('/active/:jobSiteId', entryController.getActiveEntries);
router.post('/exit', validate(exitEntrySchema), entryController.processExit);
router.get('/search', entryController.searchEntries);
router.get('/:id', entryController.getEntryById);

export default router;






