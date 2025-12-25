import { Response, NextFunction } from 'express';
import pool from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

/**
 * Get dashboard summary for a client's site
 */
export const getDashboardSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    const { siteId } = req.params;

    // Check job site access if not admin
    if (req.user.role !== 'admin') {
      const jobSiteAccess = req.user.job_site_access || [];
      if (!jobSiteAccess.includes(siteId)) {
        const error: AppError = new Error('Access denied to this job site');
        error.statusCode = 403;
        error.code = 'JOB_SITE_ACCESS_DENIED';
        return next(error);
      }
    }

    // Verify job site exists
    const jobSiteResult = await pool.query('SELECT * FROM job_sites WHERE id = $1', [siteId]);
    if (jobSiteResult.rows.length === 0) {
      const error: AppError = new Error('Job site not found');
      error.statusCode = 404;
      error.code = 'JOB_SITE_NOT_FOUND';
      return next(error);
    }

    const jobSite = jobSiteResult.rows[0];

    // Get current date boundaries (start and end of today in UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Current occupancy: entries with no exit_time
    const currentOccupancyResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM entries 
       WHERE job_site_id = $1 AND exit_time IS NULL AND entry_time IS NOT NULL`,
      [siteId]
    );
    const currentOccupancy = parseInt(currentOccupancyResult.rows[0].count, 10);

    // Today's entries: entries where DATE(entry_time) = CURRENT_DATE
    const todayEntriesResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM entries 
       WHERE job_site_id = $1 
       AND entry_time >= $2 
       AND entry_time <= $3 
       AND entry_time IS NOT NULL`,
      [siteId, todayStart, todayEnd]
    );
    const todayEntries = parseInt(todayEntriesResult.rows[0].count, 10);

    // Today's exits: entries where DATE(exit_time) = CURRENT_DATE
    const todayExitsResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM entries 
       WHERE job_site_id = $1 
       AND exit_time >= $2 
       AND exit_time <= $3`,
      [siteId, todayStart, todayEnd]
    );
    const todayExits = parseInt(todayExitsResult.rows[0].count, 10);

    // Active alerts: count alerts today where type is 'watchlist_match' or entry has associated alert
    const activeAlertsResult = await pool.query(
      `SELECT COUNT(DISTINCT a.id) as count
       FROM alerts a
       LEFT JOIN entries e ON a.entry_id = e.id
       WHERE (a.job_site_id = $1 OR e.job_site_id = $1)
       AND a.created_at >= $2
       AND a.created_at <= $3
       AND (a.type = 'watchlist_match' OR a.entry_id IS NOT NULL)`,
      [siteId, todayStart, todayEnd]
    );
    const activeAlerts = parseInt(activeAlertsResult.rows[0].count, 10);

    // Recent entries: last 10 entries ordered by entry_time DESC
    const recentEntriesResult = await pool.query(
      `SELECT 
        e.id,
        e.entry_type,
        e.entry_data,
        e.entry_time,
        e.exit_time,
        e.photos,
        e.status
       FROM entries e
       WHERE e.job_site_id = $1
       AND e.entry_time IS NOT NULL
       ORDER BY e.entry_time DESC
       LIMIT 10`,
      [siteId]
    );

    // Process recent entries
    const recentEntries = recentEntriesResult.rows.map((row) => {
      const entryData = typeof row.entry_data === 'string' ? JSON.parse(row.entry_data) : row.entry_data;
      const photos = typeof row.photos === 'string' ? JSON.parse(row.photos) : (row.photos || []);
      
      // Extract identifier and company from entry_data based on entry_type
      let identifier = '';
      let companyName = '';
      
      if (row.entry_type === 'vehicle' || row.entry_type === 'truck') {
        identifier = entryData.license_plate || '';
        companyName = entryData.company || '';
      } else if (row.entry_type === 'visitor') {
        identifier = entryData.name || '';
        companyName = entryData.company || '';
      }

      // Get first photo ID for thumbnail
      const photoId = photos && photos.length > 0 ? photos[0] : null;

      return {
        id: row.id,
        entryType: row.entry_type,
        identifier,
        companyName,
        entryTime: row.entry_time,
        exitTime: row.exit_time,
        photoUrl: photoId,
        isOnSite: row.exit_time === null,
      };
    });

    // Peak occupancy time: find hour with highest occupancy today
    const peakOccupancyResult = await pool.query(
      `SELECT 
        EXTRACT(HOUR FROM entry_time) as hour,
        COUNT(*) as count
       FROM entries
       WHERE job_site_id = $1
       AND entry_time >= $2
       AND entry_time <= $3
       AND entry_time IS NOT NULL
       GROUP BY EXTRACT(HOUR FROM entry_time)
       ORDER BY count DESC
       LIMIT 1`,
      [siteId, todayStart, todayEnd]
    );

    let peakOccupancyTime = null;
    if (peakOccupancyResult.rows.length > 0) {
      const hour = parseInt(peakOccupancyResult.rows[0].hour, 10);
      peakOccupancyTime = `${hour.toString().padStart(2, '0')}:00`;
    }

    const summary = {
      currentOccupancy,
      todayEntries,
      todayExits,
      activeAlerts,
      recentEntries,
      peakOccupancyTime,
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Error fetching dashboard summary:', error);
    next(error);
  }
};

