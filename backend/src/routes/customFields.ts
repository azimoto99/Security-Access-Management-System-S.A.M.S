import { Router } from 'express';
import * as customFieldController from '../controllers/customFieldController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validator';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createCustomFieldSchema = Joi.object({
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

const updateCustomFieldSchema = Joi.object({
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
}).unknown(false); // Prevent updating is_custom or field_key

const reorderCustomFieldsSchema = Joi.object({
  job_site_id: Joi.string().uuid().required(),
  entry_type: Joi.string().valid('vehicle', 'visitor', 'truck').required(),
  field_ids: Joi.array().items(Joi.string().uuid()).required(),
});

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// Get custom fields for a job site (optionally filtered by entry_type)
router.get('/', customFieldController.getCustomFields);

// Get a single custom field by ID
router.get('/:id', customFieldController.getCustomFieldById);

// Create a new custom field
router.post('/', validate(createCustomFieldSchema), customFieldController.createCustomField);

// Update a custom field
router.put('/:id', validate(updateCustomFieldSchema), customFieldController.updateCustomField);

// Delete a custom field
router.delete('/:id', customFieldController.deleteCustomField);

// Reorder custom fields
router.post('/reorder', validate(reorderCustomFieldsSchema), customFieldController.reorderCustomFields);

export default router;

