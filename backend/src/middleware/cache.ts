import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // 5 minutes default TTL
    this.defaultTTL = defaultTTL;

    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    this.store.forEach((entry, key) => {
      if (entry.timestamp + entry.ttl < now) {
        this.store.delete(key);
      }
    });
  }

  get(key: string): any | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (entry.timestamp + entry.ttl < now) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any, ttl?: number): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  // Delete all keys matching a pattern
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    this.store.forEach((_, key) => {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    });
  }
}

export const cache = new MemoryCache();

/**
 * Cache middleware
 */
export const cacheMiddleware = (ttl?: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `cache:${req.originalUrl || req.url}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (body: any) {
      cache.set(cacheKey, body, ttl);
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate cache for a pattern
 */
export const invalidateCache = (pattern: string): void => {
  cache.deletePattern(pattern);
};


