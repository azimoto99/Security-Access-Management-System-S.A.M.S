import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private getKey(req: Request): string {
    // Use IP address and user ID if available
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || '';
    return `${ip}:${userId}`;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const key = this.getKey(req);
      const now = Date.now();

      // Get or create entry
      if (!this.store[key] || this.store[key].resetTime < now) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs,
        };
        return next();
      }

      // Increment count
      this.store[key].count += 1;

      // Check if limit exceeded
      if (this.store[key].count > this.maxRequests) {
        const resetTime = new Date(this.store[key].resetTime).toISOString();
        res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', resetTime);
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again after ${resetTime}`,
        });
        logger.warn(`Rate limit exceeded for ${key}`);
        return;
      }

      // Set rate limit headers
      const remaining = Math.max(0, this.maxRequests - this.store[key].count);
      res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(this.store[key].resetTime).toISOString());

      next();
    };
  }
}

// Create rate limiters for different endpoints
export const generalRateLimiter = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authRateLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes for auth
export const strictRateLimiter = new RateLimiter(60 * 60 * 1000, 10); // 10 requests per hour for sensitive operations








