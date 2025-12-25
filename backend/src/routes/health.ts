import { Router, Request, Response } from 'express';
import { getSystemHealth } from '../utils/monitoring';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const health = await getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json({
      success: true,
      data: health,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Health check failed',
    });
  }
});

export default router;










