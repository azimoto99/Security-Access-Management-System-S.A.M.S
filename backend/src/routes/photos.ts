import { Router } from 'express';
import * as photoController from '../controllers/photoController';
import { authenticateToken } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';

const router = Router();

// Handle OPTIONS preflight requests for CORS (before authentication)
router.options('*', (req, res) => {
  const { config } = require('../utils/env');
  const allowedOrigin = config.cors.origin;
  const requestOrigin = req.headers.origin;
  
  // Set CORS headers for preflight
  if (allowedOrigin === '*' || (requestOrigin && allowedOrigin === requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin || allowedOrigin || '*');
  } else if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  } else if (requestOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.sendStatus(200);
});

// All routes require authentication
router.use(authenticateToken);

// Routes
router.post('/upload', uploadMultiple, photoController.uploadPhotos);
router.get('/entry/:entryId', photoController.getEntryPhotos);
router.get('/:id', photoController.getPhoto);
router.delete('/:id', photoController.deletePhoto);

export default router;





