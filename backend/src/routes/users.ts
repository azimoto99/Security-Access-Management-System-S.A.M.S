import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validator';
import Joi from 'joi';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole('admin'));

// Validation schemas
const createUserSchema = Joi.object({
  username: Joi.string().required().min(3).max(255),
  password: Joi.string().required().min(8),
  role: Joi.string().valid('guard', 'admin', 'employee').required(),
  job_site_access: Joi.array().items(Joi.string().uuid()).optional(),
  employee_id: Joi.string().optional(),
});

const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(255).optional(),
  role: Joi.string().valid('guard', 'admin', 'employee').optional(),
  job_site_access: Joi.array().items(Joi.string().uuid()).optional(),
  employee_id: Joi.string().optional().allow(null),
  onboarding_status: Joi.string().valid('pending', 'in_progress', 'completed').optional().allow(null),
});

// Routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', validate(createUserSchema), userController.createUser);
router.put('/:id', validate(updateUserSchema), userController.updateUser);
router.post('/:id/activate', userController.activateUser);
router.post('/:id/deactivate', userController.deactivateUser);
router.post('/:id/reset-password', userController.resetUserPassword);

export default router;



