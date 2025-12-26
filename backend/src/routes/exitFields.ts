import { Router } from 'express';
import * as exitFieldController from '../controllers/exitFieldController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validator';
import Joi from 'joi';

const router = Router();

// Validation schemas (same as custom fields)
const createExitFieldSchema = Joi.object({
  job_site_id: Joi.string().uuid().required(),
  entry_type: Joi.string().valid('vehicle', 'visitor', 'truck').required(),
  field_key: Joi.string().pattern(/^[a-z][a-z0-9_]*$/).required(),
  field_label: Joi.string().min(1).max(255).required(),
  field_type: Joi.string().valid('text', 'number', 'select', 'date', 'boolean', 'textarea', 'email', 'phone').required(),
  is_required: Joi.boolean().optional(),
  is_active: Joi.boolean().optional(),
  options: Joi.array().items(
    Joi.object({
      value: Joi.string().required(),
      label: Joi.string().required(),
    })
  ).optional(),
  validation: Joi.object({
    minLength: Joi.number().integer().min(0).optional(),
    maxLength: Joi.number().integer().min(0).optional(),
    min: Joi.number().optional(),
    max: Joi.number().optional(),
    pattern: Joi.string().optional(),
  }).optional(),
  display_order: Joi.number().integer().min(0).optional(),
  placeholder: Joi.string().allow('').optional(),
  help_text: Joi.string().allow('').optional(),
});

const updateExitFieldSchema = Joi.object({
  field_label: Joi.string().min(1).max(255).optional(),
  field_type: Joi.string().valid('text', 'number', 'select', 'date', 'boolean', 'textarea', 'email', 'phone').optional(),
  is_required: Joi.boolean().optional(),
  is_active: Joi.boolean().optional(),
  options: Joi.array().items(
    Joi.object({
      value: Joi.string().required(),
      label: Joi.string().required(),
    })
  ).optional(),
  validation: Joi.object({
    minLength: Joi.number().integer().min(0).optional(),
    maxLength: Joi.number().integer().min(0).optional(),
    min: Joi.number().optional(),
    max: Joi.number().optional(),
    pattern: Joi.string().optional(),
  }).optional(),
  display_order: Joi.number().integer().min(0).optional(),
  placeholder: Joi.string().allow('').optional(),
  help_text: Joi.string().allow('').optional(),
}).unknown(false);

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole('admin'));

// Get exit fields for a job site (optionally filtered by entry_type)
router.get('/', exitFieldController.getExitFields);

// Create a new exit field
router.post('/', validate(createExitFieldSchema), exitFieldController.createExitField);

// Update an exit field
router.put('/:id', validate(updateExitFieldSchema), exitFieldController.updateExitField);

// Delete an exit field
router.delete('/:id', exitFieldController.deleteExitField);

export default router;

