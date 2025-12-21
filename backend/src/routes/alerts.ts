import { Router } from 'express';
import * as alertController from '../controllers/alertController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validator';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createAlertSchema = Joi.object({
  type: Joi.string().valid('overstay', 'capacity_warning', 'watchlist_match', 'invalid_exit', 'failed_login', 'account_locked').required(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  title: Joi.string().required(),
  message: Joi.string().required(),
  job_site_id: Joi.string().uuid().optional(),
  entry_id: Joi.string().uuid().optional(),
  watchlist_id: Joi.string().uuid().optional(),
  user_id: Joi.string().uuid().optional(),
  metadata: Joi.object().optional(),
});

// Routes
router.get('/', alertController.getAlerts);
router.post('/', authorizeRole('admin'), validate(createAlertSchema), alertController.createAlert);
router.post('/:id/acknowledge', alertController.acknowledgeAlert);
router.post('/trigger-checks', authorizeRole('admin'), alertController.triggerAlertChecks);

export default router;






