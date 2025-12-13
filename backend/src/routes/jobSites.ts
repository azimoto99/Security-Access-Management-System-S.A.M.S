import { Router } from 'express';
import * as jobSiteController from '../controllers/jobSiteController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createJobSiteSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  address: Joi.string().required().min(1),
  contact_info: Joi.object().optional(),
  vehicle_capacity: Joi.number().integer().min(0).optional().default(0),
  visitor_capacity: Joi.number().integer().min(0).optional().default(0),
  truck_capacity: Joi.number().integer().min(0).optional().default(0),
});

const updateJobSiteSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  address: Joi.string().min(1).optional(),
  contact_info: Joi.object().optional(),
  vehicle_capacity: Joi.number().integer().min(0).optional(),
  visitor_capacity: Joi.number().integer().min(0).optional(),
  truck_capacity: Joi.number().integer().min(0).optional(),
});

// All routes require authentication
router.use(authenticateToken);

// Get all job sites (accessible to all authenticated users) - cached for 2 minutes
router.get('/', cacheMiddleware(2 * 60 * 1000), jobSiteController.getAllJobSites);

// Get job site by ID (accessible to all authenticated users) - cached for 2 minutes
router.get('/:id', cacheMiddleware(2 * 60 * 1000), jobSiteController.getJobSiteById);

// Create, update, delete routes require admin role
router.post('/', authorizeRole('admin'), validate(createJobSiteSchema), jobSiteController.createJobSite);
router.put('/:id', authorizeRole('admin'), validate(updateJobSiteSchema), jobSiteController.updateJobSite);
router.delete('/:id', authorizeRole('admin'), jobSiteController.deleteJobSite);

// Activate/deactivate routes require admin role
router.post('/:id/activate', authorizeRole('admin'), jobSiteController.activateJobSite);
router.post('/:id/deactivate', authorizeRole('admin'), jobSiteController.deactivateJobSite);

export default router;


