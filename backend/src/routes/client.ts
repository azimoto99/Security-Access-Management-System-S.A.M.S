import { Router } from 'express';
import * as clientController from '../controllers/clientController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Dashboard summary endpoint
router.get('/dashboard/:siteId/summary', clientController.getDashboardSummary);

// Recent entries endpoint (for pagination)
router.get('/dashboard/:siteId/recent-entries', clientController.getRecentEntries);

export default router;

