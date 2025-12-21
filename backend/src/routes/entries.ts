import { Router } from 'express';
import * as entryController from '../controllers/entryController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
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

const manualExitSchema = Joi.object({
  job_site_id: Joi.string().uuid().required(),
  entry_type: Joi.string().valid('vehicle', 'truck').required(),
  entry_data: Joi.object({
    license_plate: Joi.string().required(),
    truck_number: Joi.string().when('entry_type', {
      is: 'truck',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    trailer_number: Joi.string().optional(),
    destination: Joi.string().valid('north', 'south').optional(),
    driver_name: Joi.string().optional(),
    company: Joi.string().optional(),
    cargo_description: Joi.string().optional(),
  }).required(),
});

// Routes
// Create entry - guards and admins only (clients can only view)
router.post('/', authorizeRole(['guard', 'admin']), validate(createEntrySchema), entryController.createEntry);
// Manual exit - guards and admins only
router.post('/manual-exit', authorizeRole(['guard', 'admin']), validate(manualExitSchema), entryController.createManualExit);
// Process exit - guards and admins only
router.post('/exit', authorizeRole(['guard', 'admin']), validate(exitEntrySchema), entryController.processExit);
// View routes - all authenticated users (guards, admins, clients)
router.get('/active/:jobSiteId', entryController.getActiveEntries);
router.get('/search', entryController.searchEntries);
router.get('/:id', entryController.getEntryById);

export default router;






