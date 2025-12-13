import { Router } from 'express';
import * as auditLogController from '../controllers/auditLogController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole('admin'));

// Routes
router.get('/', auditLogController.getAuditLogs);
router.get('/export', auditLogController.exportAuditLogs);

export default router;





