import { Router } from 'express';
import * as clientController from '../controllers/clientController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Dashboard summary endpoint
router.get('/dashboard/:siteId/summary', clientController.getDashboardSummary);

export default router;

