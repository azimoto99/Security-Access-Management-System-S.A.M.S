import { Router } from 'express';
import * as occupancyController from '../controllers/occupancyController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/', occupancyController.getAllOccupancy);
router.get('/:jobSiteId', occupancyController.getJobSiteOccupancy);
router.get('/:jobSiteId/breakdown', occupancyController.getJobSiteBreakdown);

export default router;

















