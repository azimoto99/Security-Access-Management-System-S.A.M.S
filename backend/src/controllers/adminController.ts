import { Response, NextFunction } from 'express';
import pool from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

/**
 * Get admin dashboard metrics
 */
export const getDashboardMetrics = async (
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

    // Get current date boundaries
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    // Get 4 hours ago timestamp for active sites
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

    // Total sites
    const totalSitesResult = await pool.query(
      'SELECT COUNT(*) as count FROM job_sites WHERE is_active = true'
    );
    const totalSites = parseInt(totalSitesResult.rows[0].count, 10);

    // Active sites (had entries in last 4 hours)
    const activeSitesResult = await pool.query(
      `SELECT COUNT(DISTINCT job_site_id) as count
       FROM entries
       WHERE entry_time >= $1 AND entry_time IS NOT NULL`,
      [fourHoursAgo]
    );
    const activeSites = parseInt(activeSitesResult.rows[0].count, 10);

    // Today's entries
    const todayEntriesResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM entries
       WHERE entry_time >= $1 AND entry_time <= $2 AND entry_time IS NOT NULL`,
      [todayStart, todayEnd]
    );
    const todayEntries = parseInt(todayEntriesResult.rows[0].count, 10);

    // Yesterday's entries
    const yesterdayEntriesResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM entries
       WHERE entry_time >= $1 AND entry_time <= $2 AND entry_time IS NOT NULL`,
      [yesterdayStart, yesterdayEnd]
    );
    const yesterdayEntries = parseInt(yesterdayEntriesResult.rows[0].count, 10);

    // Calculate percentage change
    let entriesChange = 0;
    if (yesterdayEntries > 0) {
      entriesChange = ((todayEntries - yesterdayEntries) / yesterdayEntries) * 100;
    } else if (todayEntries > 0) {
      entriesChange = 100;
    }

    // Current occupancy across all sites
    const currentOccupancyResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM entries
       WHERE exit_time IS NULL AND entry_time IS NOT NULL`
    );
    const currentOccupancy = parseInt(currentOccupancyResult.rows[0].count, 10);

    // Active alerts (unacknowledged alerts from today)
    const activeAlertsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM alerts
       WHERE is_acknowledged = false
       AND created_at >= $1`,
      [todayStart]
    );
    const activeAlerts = parseInt(activeAlertsResult.rows[0].count, 10);

    res.json({
      success: true,
      data: {
        activeSites,
        totalSites,
        todayEntries,
        yesterdayEntries,
        entriesChange: Math.round(entriesChange * 10) / 10, // Round to 1 decimal
        currentOccupancy,
        activeAlerts,
      },
    });
  } catch (error) {
    logger.error('Error in getDashboardMetrics:', error);
    next(error);
  }
};

/**
 * Get all sites status for admin dashboard
 */
export const getSitesStatus = async (
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

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // Get all active sites
    // Note: job_sites table doesn't have client_id column
    // Clients are associated via job_site_access in users table
    const sitesResult = await pool.query(
      `SELECT js.*
       FROM job_sites js
       WHERE js.is_active = true
       ORDER BY js.name`
    );

    const sites = await Promise.all(
      sitesResult.rows.map(async (site) => {
        // Get current occupancy
        const occupancyResult = await pool.query(
          `SELECT COUNT(*) as count
           FROM entries
           WHERE job_site_id = $1 AND exit_time IS NULL AND entry_time IS NOT NULL`,
          [site.id]
        );
        const currentOccupancy = parseInt(occupancyResult.rows[0].count, 10);

        // Get today's entries
        const todayEntriesResult = await pool.query(
          `SELECT COUNT(*) as count
           FROM entries
           WHERE job_site_id = $1
           AND entry_time >= $2
           AND entry_time IS NOT NULL`,
          [site.id, todayStart]
        );
        const todayEntries = parseInt(todayEntriesResult.rows[0].count, 10);

        // Get last entry time
        const lastEntryResult = await pool.query(
          `SELECT entry_time
           FROM entries
           WHERE job_site_id = $1 AND entry_time IS NOT NULL
           ORDER BY entry_time DESC
           LIMIT 1`,
          [site.id]
        );
        const lastEntryTime = lastEntryResult.rows[0]?.entry_time || null;

        // Check for active alerts
        const alertsResult = await pool.query(
          `SELECT COUNT(*) as count
           FROM alerts
           WHERE job_site_id = $1
           AND is_acknowledged = false
           AND created_at >= $2`,
          [site.id, todayStart]
        );
        const hasAlerts = parseInt(alertsResult.rows[0].count, 10) > 0;

        // Determine status
        let status: 'active' | 'moderate' | 'quiet' | 'alert' = 'quiet';
        if (hasAlerts) {
          status = 'alert';
        } else if (lastEntryTime) {
          const lastEntry = new Date(lastEntryTime);
          if (lastEntry >= oneHourAgo) {
            status = 'active';
          } else if (lastEntry >= fourHoursAgo) {
            status = 'moderate';
          }
        }

        return {
          id: site.id,
          name: site.name,
          clientName: null, // Clients are associated via job_site_access, not a direct column
          status,
          currentOccupancy,
          todayEntries,
          lastEntryTime,
          hasAlerts,
        };
      })
    );

    res.json({
      success: true,
      data: sites,
    });
  } catch (error) {
    logger.error('Error in getDashboardMetrics:', error);
    next(error);
  }
};

/**
 * Get recent activity across all sites
 */
export const getRecentActivity = async (
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

    const limit = parseInt((req.query.limit as string) || '20', 10);

    const result = await pool.query(
      `SELECT 
        e.*,
        js.name as site_name,
        a.id as alert_id,
        a.type as alert_type
       FROM entries e
       LEFT JOIN job_sites js ON e.job_site_id = js.id
       LEFT JOIN alerts a ON a.entry_id = e.id AND a.is_acknowledged = false
       WHERE e.entry_time IS NOT NULL
       ORDER BY e.entry_time DESC
       LIMIT $1`,
      [limit]
    );

    const activities = result.rows.map((row) => {
      let entryData: any = {};
      try {
        entryData = typeof row.entry_data === 'string' ? JSON.parse(row.entry_data) : (row.entry_data || {});
      } catch (e) {
        logger.error('Error parsing entry_data in getRecentActivity:', e);
        entryData = {};
      }

      let photos: string[] = [];
      try {
        photos = typeof row.photos === 'string' ? JSON.parse(row.photos) : (row.photos || []);
      } catch (e) {
        logger.error('Error parsing photos in getRecentActivity:', e);
        photos = [];
      }

      const identifier = row.entry_type === 'visitor' 
        ? (entryData.name || 'Unknown')
        : (entryData.license_plate || 'Unknown');

      return {
        id: row.id,
        entryType: row.entry_type,
        identifier,
        company: entryData.company || '',
        siteName: row.site_name || 'Unknown Site',
        entryTime: row.entry_time,
        exitTime: row.exit_time,
        hasAlert: !!row.alert_id,
        alertType: row.alert_type,
        photos: photos,
      };
    });

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    logger.error('Error in getDashboardMetrics:', error);
    next(error);
  }
};

/**
 * Get analytics data for charts
 */
export const getAnalytics = async (
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

    const period = (req.query.period as string) || 'today'; // today, week, month

    let startDate: Date;
    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setUTCHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setUTCHours(0, 0, 0, 0);
        break;
      default: // today
        startDate = new Date();
        startDate.setUTCHours(0, 0, 0, 0);
    }

    // Entries over time
    let entriesOverTime: any[] = [];
    if (period === 'today') {
      // Hourly for today
      const hourlyResult = await pool.query(
        `SELECT 
          EXTRACT(HOUR FROM entry_time) as hour,
          COUNT(*) as count
         FROM entries
         WHERE entry_time >= $1 AND entry_time <= $2 AND entry_time IS NOT NULL
         GROUP BY EXTRACT(HOUR FROM entry_time)
         ORDER BY hour`,
        [startDate, endDate]
      );
      entriesOverTime = hourlyResult.rows.map((row) => ({
        time: `${Math.floor(row.hour)}:00`,
        entries: parseInt(row.count, 10),
      }));
    } else {
      // Daily for week/month
      const dailyResult = await pool.query(
        `SELECT 
          DATE(entry_time) as date,
          COUNT(*) as count
         FROM entries
         WHERE entry_time >= $1 AND entry_time <= $2 AND entry_time IS NOT NULL
         GROUP BY DATE(entry_time)
         ORDER BY date`,
        [startDate, endDate]
      );
      entriesOverTime = dailyResult.rows.map((row) => ({
        time: new Date(row.date).toLocaleDateString(),
        entries: parseInt(row.count, 10),
      }));
    }

    // Entries by site
    const entriesBySiteResult = await pool.query(
      `SELECT 
        js.name as site_name,
        COUNT(*) as count
       FROM entries e
       LEFT JOIN job_sites js ON e.job_site_id = js.id
       WHERE e.entry_time >= $1 AND e.entry_time <= $2 AND e.entry_time IS NOT NULL
       GROUP BY js.name
       ORDER BY count DESC`,
      [startDate, endDate]
    );
    const entriesBySite = entriesBySiteResult.rows.map((row) => ({
      site: row.site_name || 'Unknown',
      entries: parseInt(row.count, 10),
    }));

    // Entry type breakdown
    const entryTypeResult = await pool.query(
      `SELECT 
        entry_type,
        COUNT(*) as count
       FROM entries
       WHERE entry_time >= $1 AND entry_time <= $2 AND entry_time IS NOT NULL
       GROUP BY entry_type`,
      [startDate, endDate]
    );
    const entryTypeBreakdown = entryTypeResult.rows.map((row) => ({
      type: row.entry_type,
      count: parseInt(row.count, 10),
    }));

    res.json({
      success: true,
      data: {
        entriesOverTime,
        entriesBySite,
        entryTypeBreakdown,
      },
    });
  } catch (error) {
    logger.error('Error in getDashboardMetrics:', error);
    next(error);
  }
};

/**
 * Get active alerts for admin dashboard
 */
export const getActiveAlerts = async (
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

    const result = await pool.query(
      `SELECT 
        a.*,
        js.name as site_name,
        e.entry_type,
        e.entry_data
       FROM alerts a
       LEFT JOIN job_sites js ON a.job_site_id = js.id
       LEFT JOIN entries e ON a.entry_id = e.id
       WHERE a.is_acknowledged = false
       ORDER BY a.created_at DESC
       LIMIT 50`
    );

    const alerts = result.rows.map((row) => {
      let entryData: any = {};
      try {
        entryData = typeof row.entry_data === 'string' ? JSON.parse(row.entry_data) : (row.entry_data || {});
      } catch (e) {
        logger.error('Error parsing entry_data in getActiveAlerts:', e);
        entryData = {};
      }

      const identifier = row.entry_type === 'visitor' 
        ? (entryData?.name || 'Unknown')
        : (entryData?.license_plate || 'Unknown');
      
      return {
        id: row.id,
        type: row.type,
        siteName: row.site_name || 'Unknown Site',
        entryId: row.entry_id,
        entryType: row.entry_type,
        identifier,
        description: row.description || `${row.type} detected`,
        createdAt: row.created_at,
        priority: row.priority || 'medium',
      };
    });

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    logger.error('Error in getDashboardMetrics:', error);
    next(error);
  }
};

/**
 * Get client portal usage statistics
 */
export const getClientUsage = async (
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

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // Get all client users
    // Note: Clients are associated with job sites via job_site_access array in users table
    // Count sites by checking which job sites are in the user's job_site_access array
    const clientsResult = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.last_login,
        u.job_site_access,
        jsonb_array_length(COALESCE(u.job_site_access, '[]'::jsonb)) as site_count
       FROM users u
       WHERE u.role = 'client' AND u.is_active = true
       ORDER BY u.username`
    );

    const clients = await Promise.all(
      clientsResult.rows.map(async (client) => {
        // Get total entries at their sites today
        const entriesResult = await pool.query(
          `SELECT COUNT(*) as count
           FROM entries e
           INNER JOIN job_sites js ON e.job_site_id = js.id
           WHERE js.client_id = $1
           AND e.entry_time >= $2
           AND e.entry_time IS NOT NULL`,
          [client.id, todayStart]
        );
        const todayEntries = parseInt(entriesResult.rows[0].count, 10);

        // Determine activity level
        let activityLevel: 'active' | 'moderate' | 'inactive' = 'inactive';
        if (client.last_login) {
          const lastLogin = new Date(client.last_login);
          const daysSinceLogin = (new Date().getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceLogin <= 1) {
            activityLevel = 'active';
          } else if (daysSinceLogin <= 7) {
            activityLevel = 'moderate';
          }
        }

        return {
          id: client.id,
          name: client.username,
          siteCount: parseInt(client.site_count, 10),
          lastLogin: client.last_login,
          activityLevel,
          todayEntries,
        };
      })
    );

    res.json({
      success: true,
      data: clients,
    });
  } catch (error) {
    logger.error('Error in getDashboardMetrics:', error);
    next(error);
  }
};

