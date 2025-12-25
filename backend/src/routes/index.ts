import { Router } from 'express';
import authRoutes from './auth';
import jobSitesRoutes from './jobSites';
import entriesRoutes from './entries';
import photosRoutes from './photos';
import occupancyRoutes from './occupancy';
import auditLogsRoutes from './auditLogs';
import reportsRoutes from './reports';
import usersRoutes from './users';
import watchlistRoutes from './watchlist';
import alertsRoutes from './alerts';
import emergencyRoutes from './emergency';
import hrDocumentsRoutes from './hrDocuments';
import healthRoutes from './health';
import clientRoutes from './client';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Job sites routes
router.use('/job-sites', jobSitesRoutes);

// Entries routes
router.use('/entries', entriesRoutes);

// Photos routes
router.use('/photos', photosRoutes);

// Occupancy routes
router.use('/occupancy', occupancyRoutes);

// Audit logs routes (admin only)
router.use('/audit-logs', auditLogsRoutes);

// Reports routes (admin only)
router.use('/reports', reportsRoutes);

// Users routes (admin only)
router.use('/users', usersRoutes);

// Watchlist routes
router.use('/watchlist', watchlistRoutes);

// Alerts routes
router.use('/alerts', alertsRoutes);

// Emergency routes
router.use('/emergency', emergencyRoutes);

// HR Documents routes
router.use('/hr', hrDocumentsRoutes);

// Client routes
router.use('/client', clientRoutes);

// Health check route (no auth required)
router.use('/health', healthRoutes);

export default router;

