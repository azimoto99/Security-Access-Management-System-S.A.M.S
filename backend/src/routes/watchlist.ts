import { Router } from 'express';
import * as watchlistController from '../controllers/watchlistController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validator';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createWatchlistSchema = Joi.object({
  type: Joi.string().valid('person', 'vehicle').required(),
  identifier: Joi.string().required().min(1).max(255),
  reason: Joi.string().required().min(1),
  alert_level: Joi.string().valid('low', 'medium', 'high').optional(),
});

const updateWatchlistSchema = Joi.object({
  identifier: Joi.string().min(1).max(255).optional(),
  reason: Joi.string().min(1).optional(),
  alert_level: Joi.string().valid('low', 'medium', 'high').optional(),
  is_active: Joi.boolean().optional(),
});

// Routes
router.get('/', watchlistController.getAllWatchlistEntries);
router.get('/:id', watchlistController.getWatchlistEntryById);
router.post('/', authorizeRole('admin'), validate(createWatchlistSchema), watchlistController.createWatchlistEntry);
router.put('/:id', authorizeRole('admin'), validate(updateWatchlistSchema), watchlistController.updateWatchlistEntry);
router.delete('/:id', authorizeRole('admin'), watchlistController.deleteWatchlistEntry);

export default router;

















