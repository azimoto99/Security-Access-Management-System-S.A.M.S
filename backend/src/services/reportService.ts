import pool from '../config/database';
import { logger } from '../utils/logger';

export interface ReportFilters {
  job_site_id?: string;
  date_from: string;
  date_to: string;
  entry_type?: string;
}

export interface ReportData {
  summary: {
    total_entries: number;
    total_exits: number;
    active_entries: number;
    by_type: {
      vehicles: number;
      visitors: number;
      trucks: number;
    };
  };
  peak_hours: Array<{
    hour: number;
    count: number;
  }>;
  average_duration: number; // in minutes
  by_job_site?: Array<{
    job_site_id: string;
    job_site_name: string;
    entries: number;
    exits: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    entries: number;
    exits: number;
  }>;
}

/**
 * Generate report data
 */
export const generateReport = async (filters: ReportFilters): Promise<ReportData> => {
  try {
    const { job_site_id, date_from, date_to, entry_type } = filters;

    // Convert date strings to timestamps in Central Time for comparison
    // PostgreSQL stores timestamps in UTC, so we convert the filter times (assumed Central Time) to UTC
    let baseQuery = `
      FROM entries e
      LEFT JOIN job_sites js ON e.job_site_id = js.id
      WHERE e.entry_time >= (($1::text || ' America/Chicago')::timestamptz AT TIME ZONE 'UTC')
        AND e.entry_time <= (($2::text || ' America/Chicago')::timestamptz AT TIME ZONE 'UTC')
    `;
    const params: any[] = [date_from, date_to];
    let paramCount = 3;

    if (job_site_id) {
      baseQuery += ` AND e.job_site_id = $${paramCount++}`;
      params.push(job_site_id);
    }

    if (entry_type) {
      baseQuery += ` AND e.entry_type = $${paramCount++}`;
      params.push(entry_type);
    }

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN status != 'active' THEN 1 END) as total_exits,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_entries,
        COUNT(CASE WHEN entry_type = 'vehicle' THEN 1 END) as vehicles,
        COUNT(CASE WHEN entry_type = 'visitor' THEN 1 END) as visitors,
        COUNT(CASE WHEN entry_type = 'truck' THEN 1 END) as trucks
      ${baseQuery}
    `;

    const summaryResult = await pool.query(summaryQuery, params);
    const summary = summaryResult.rows[0];

    // Get peak hours (in Central Time)
    const peakHoursQuery = `
      SELECT 
        EXTRACT(HOUR FROM (entry_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')) as hour,
        COUNT(*) as count
      ${baseQuery}
      GROUP BY EXTRACT(HOUR FROM (entry_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago'))
      ORDER BY count DESC
      LIMIT 10
    `;

    const peakHoursResult = await pool.query(peakHoursQuery, params);
    const peak_hours = peakHoursResult.rows.map((row) => ({
      hour: parseInt(row.hour),
      count: parseInt(row.count),
    }));

    // Calculate average duration
    const avgDurationQuery = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (exit_time - entry_time)) / 60) as avg_duration
      ${baseQuery}
      AND exit_time IS NOT NULL
    `;

    const avgDurationResult = await pool.query(avgDurationQuery, params);
    const average_duration = avgDurationResult.rows[0]?.avg_duration
      ? Math.round(parseFloat(avgDurationResult.rows[0].avg_duration))
      : 0;

    // Get breakdown by job site (if not filtering by specific job site)
    let by_job_site: ReportData['by_job_site'] = undefined;
    if (!job_site_id) {
      const jobSiteQuery = `
        SELECT 
          e.job_site_id,
          js.name as job_site_name,
          COUNT(*) as entries,
          COUNT(CASE WHEN e.status != 'active' THEN 1 END) as exits
        ${baseQuery}
        GROUP BY e.job_site_id, js.name
        ORDER BY entries DESC
      `;

      const jobSiteResult = await pool.query(jobSiteQuery, params);
      by_job_site = jobSiteResult.rows.map((row) => ({
        job_site_id: row.job_site_id,
        job_site_name: row.job_site_name || 'Unknown',
        entries: parseInt(row.entries),
        exits: parseInt(row.exits),
      }));
    }

    // Get daily breakdown (in Central Time)
    const dailyQuery = `
      SELECT 
        DATE(entry_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') as date,
        COUNT(*) as entries,
        COUNT(CASE WHEN status != 'active' THEN 1 END) as exits
      ${baseQuery}
      GROUP BY DATE(entry_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')
      ORDER BY date ASC
    `;

    const dailyResult = await pool.query(dailyQuery, params);
    const daily_breakdown = dailyResult.rows.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      entries: parseInt(row.entries),
      exits: parseInt(row.exits),
    }));

    return {
      summary: {
        total_entries: parseInt(summary.total_entries),
        total_exits: parseInt(summary.total_exits),
        active_entries: parseInt(summary.active_entries),
        by_type: {
          vehicles: parseInt(summary.vehicles),
          visitors: parseInt(summary.visitors),
          trucks: parseInt(summary.trucks),
        },
      },
      peak_hours,
      average_duration,
      by_job_site,
      daily_breakdown,
    };
  } catch (error) {
    logger.error('Error generating report:', error);
    throw error;
  }
};









