import { Router } from 'express';
import * as emergencyController from '../controllers/emergencyController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Routes - guards and admins can access
router.get('/active', emergencyController.getActiveEmergencyModes);
router.get('/occupancy', emergencyController.getEmergencyOccupancy);
router.get('/history', authorizeRole('admin'), emergencyController.getEmergencyModeHistory);
router.post('/activate', emergencyController.activateEmergencyMode);
router.post('/:id/deactivate', emergencyController.deactivateEmergencyMode);
router.post('/bulk-exit', emergencyController.processBulkExit);

export default router;





