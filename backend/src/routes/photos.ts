import { Router } from 'express';
import * as photoController from '../controllers/photoController';
import { authenticateToken } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Handle OPTIONS preflight requests for CORS
router.options('*', (req, res) => {
  const allowedOrigin = req.headers.origin;
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  }
  res.sendStatus(200);
});

// Routes
router.post('/upload', uploadMultiple, photoController.uploadPhotos);
router.get('/entry/:entryId', photoController.getEntryPhotos);
router.get('/:id', photoController.getPhoto);
router.delete('/:id', photoController.deletePhoto);

export default router;





