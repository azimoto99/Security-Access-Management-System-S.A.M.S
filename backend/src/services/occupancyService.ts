import pool from '../config/database';
import { logger } from '../utils/logger';

export interface OccupancyCounts {
  vehicles: number;
  visitors: number;
  trucks: number;
  total: number;
}

export interface JobSiteOccupancy {
  job_site_id: string;
  job_site_name: string;
  counts: OccupancyCounts;
  capacity: {
    vehicles: number;
    visitors: number;
    trucks: number;
  };
  warnings: {
    vehicles: boolean;
    visitors: boolean;
    trucks: boolean;
  };
}

/**
 * Calculate occupancy for a specific job site
 */
export const calculateJobSiteOccupancy = async (jobSiteId: string): Promise<JobSiteOccupancy | null> => {
  try {
    // Get job site info
    const jobSiteResult = await pool.query('SELECT * FROM job_sites WHERE id = $1', [jobSiteId]);
    if (jobSiteResult.rows.length === 0) {
      return null;
    }

    const jobSite = jobSiteResult.rows[0];

    // Count active entries by type
    const countsResult = await pool.query(
      `SELECT entry_type, COUNT(*) as count
       FROM entries
       WHERE job_site_id = $1 AND status = 'active'
       GROUP BY entry_type`,
      [jobSiteId]
    );

    const counts: OccupancyCounts = {
      vehicles: 0,
      visitors: 0,
      trucks: 0,
      total: 0,
    };

    countsResult.rows.forEach((row) => {
      const count = parseInt(row.count);
      counts[row.entry_type as keyof OccupancyCounts] = count;
      counts.total += count;
    });

    // Calculate warnings (90% capacity threshold)
    const warnings = {
      vehicles: jobSite.vehicle_capacity > 0 && counts.vehicles >= jobSite.vehicle_capacity * 0.9,
      visitors: jobSite.visitor_capacity > 0 && counts.visitors >= jobSite.visitor_capacity * 0.9,
      trucks: jobSite.truck_capacity > 0 && counts.trucks >= jobSite.truck_capacity * 0.9,
    };

    return {
      job_site_id: jobSite.id,
      job_site_name: jobSite.name,
      counts,
      capacity: {
        vehicles: jobSite.vehicle_capacity,
        visitors: jobSite.visitor_capacity,
        trucks: jobSite.truck_capacity,
      },
      warnings,
    };
  } catch (error) {
    logger.error('Error calculating job site occupancy:', error);
    throw error;
  }
};

/**
 * Calculate occupancy for all active job sites
 */
export const calculateAllOccupancy = async (): Promise<JobSiteOccupancy[]> => {
  try {
    const jobSitesResult = await pool.query("SELECT id FROM job_sites WHERE is_active = true");
    const jobSiteIds = jobSitesResult.rows.map((row) => row.id);

    const occupancies: JobSiteOccupancy[] = [];
    for (const jobSiteId of jobSiteIds) {
      const occupancy = await calculateJobSiteOccupancy(jobSiteId);
      if (occupancy) {
        occupancies.push(occupancy);
      }
    }

    return occupancies;
  } catch (error) {
    logger.error('Error calculating all occupancy:', error);
    throw error;
  }
};

/**
 * Get detailed breakdown for a job site
 */
export const getJobSiteBreakdown = async (jobSiteId: string) => {
  try {
    const entriesResult = await pool.query(
      `SELECT id, entry_type, entry_data, entry_time, guard_id
       FROM entries
       WHERE job_site_id = $1 AND status = 'active'
       ORDER BY entry_time DESC`,
      [jobSiteId]
    );

    return entriesResult.rows;
  } catch (error) {
    logger.error('Error getting job site breakdown:', error);
    throw error;
  }
};



