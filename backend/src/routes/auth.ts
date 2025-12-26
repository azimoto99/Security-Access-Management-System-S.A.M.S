import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { authRateLimiter } from '../middleware/rateLimiter';
import Joi from 'joi';

const router = Router();

// Validation schemas
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const requestPasswordResetSchema = Joi.object({
  username: Joi.string().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const changeOwnPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).required(),
});

// Routes with rate limiting
router.post('/login', authRateLimiter.middleware(), validate(loginSchema), authController.login);
router.post('/refresh', authRateLimiter.middleware(), validate(refreshSchema), authController.refresh);
router.post('/logout', authenticateToken, authController.logout);
router.post('/request-password-reset', authRateLimiter.middleware(), validate(requestPasswordResetSchema), authController.requestPasswordReset);
router.post('/reset-password', authRateLimiter.middleware(), validate(resetPasswordSchema), authController.resetPassword);
router.post('/change-password', authenticateToken, validate(changeOwnPasswordSchema), authController.changeOwnPassword);
router.get('/me', authenticateToken, authController.getCurrentUser);

export default router;


