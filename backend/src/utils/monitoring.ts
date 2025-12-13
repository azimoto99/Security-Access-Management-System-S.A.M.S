import { logger } from './logger';
import pool from '../config/database';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}

/**
 * Check database connection health
 */
export const checkDatabaseHealth = async (): Promise<{ status: string; responseTime?: number }> => {
  try {
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const responseTime = Date.now() - startTime;

    return {
      status: 'connected',
      responseTime,
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'disconnected',
    };
  }
};

/**
 * Get system health status
 */
export const getSystemHealth = async (): Promise<SystemHealth> => {
  const startTime = Date.now();
  const dbHealth = await checkDatabaseHealth();
  const uptime = process.uptime();

  // Get memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const memoryPercentage = (usedMemory / totalMemory) * 100;

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (dbHealth.status === 'disconnected') {
    status = 'unhealthy';
  } else if (dbHealth.responseTime && dbHealth.responseTime > 1000) {
    status = 'degraded';
  } else if (memoryPercentage > 90) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date(),
    database: dbHealth,
    memory: {
      used: usedMemory,
      total: totalMemory,
      percentage: memoryPercentage,
    },
    uptime,
  };
};

/**
 * Log system metrics periodically
 */
export const startMetricsLogging = (intervalMs: number = 60000): void => {
  setInterval(async () => {
    try {
      const health = await getSystemHealth();
      logger.info('System metrics', {
        status: health.status,
        database: health.database.status,
        memoryUsage: `${health.memory.percentage.toFixed(2)}%`,
        uptime: `${Math.floor(health.uptime / 60)} minutes`,
      });
    } catch (error) {
      logger.error('Error logging system metrics:', error);
    }
  }, intervalMs);
};


