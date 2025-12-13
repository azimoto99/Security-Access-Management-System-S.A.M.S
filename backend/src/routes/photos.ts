import { Router } from 'express';
import * as photoController from '../controllers/photoController';
import { authenticateToken } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Routes
router.post('/upload', uploadMultiple, photoController.uploadPhotos);
router.get('/entry/:entryId', photoController.getEntryPhotos);
router.get('/:id', photoController.getPhoto);
router.delete('/:id', photoController.deletePhoto);

export default router;




