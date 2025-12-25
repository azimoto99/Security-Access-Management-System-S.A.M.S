import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import * as adminController from '../controllers/adminController';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole('admin'));

// Admin dashboard routes
router.get('/dashboard/metrics', adminController.getDashboardMetrics);
router.get('/dashboard/sites-status', adminController.getSitesStatus);
router.get('/dashboard/recent-activity', adminController.getRecentActivity);
router.get('/dashboard/analytics', adminController.getAnalytics);
router.get('/dashboard/alerts', adminController.getActiveAlerts);
router.get('/dashboard/client-usage', adminController.getClientUsage);

export default router;

