import { Router } from 'express';
import * as alertController from '../controllers/alertController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/', alertController.getAlerts);
router.post('/:id/acknowledge', alertController.acknowledgeAlert);
router.post('/trigger-checks', authorizeRole('admin'), alertController.triggerAlertChecks);

export default router;






