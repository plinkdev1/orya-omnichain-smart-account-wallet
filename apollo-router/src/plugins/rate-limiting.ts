import redis, { Redis } from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import { AuthContext } from './authentication';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request, context: AuthContext) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  store?: Redis;
}

export interface RateLimitStatus {
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
}

export class RateLimitingPlugin {
  private redis: Redis;
  private config: RateLimitConfig;
  private readonly defaultConfig: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60 * 1000,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...this.defaultConfig, ...config };

    if (this.config.store) {
      this.redis = this.config.store;
    } else {
      this.redis = new redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      });
    }

    if (!this.config.keyGenerator) {
      this.config.keyGenerator = this.defaultKeyGenerator;
    }
  }

  private defaultKeyGenerator = (req: Request, context: AuthContext): string => {
    if (context.isAuthenticated && context.userId) {
      return `ratelimit:user:${context.userId}`;
    }

    const ip = this.getClientIp(req);
    return `ratelimit:ip:${ip}`;
  };

  private getClientIp(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      return Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor.split(',')[0].trim();
    }

    return req.socket.remoteAddress || 'unknown';
  }

  async checkLimit(
    req: Request,
    context: AuthContext
  ): Promise<RateLimitStatus> {
    const key = this.config.keyGenerator!(req, context);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const pipe = this.redis.pipeline();

    pipe.zremrangebyscore(key, '-inf', windowStart);
    pipe.zadd(key, now, `${now}-${Math.random()}`);
    pipe.zcard(key);
    pipe.expire(key, Math.ceil(this.config.windowMs / 1000));

    const results = await pipe.exec();

    if (!results) {
      throw new Error('Rate limit check failed');
    }

    const currentCount = (results[2][1] as number) || 0;
    const resetTime = now + this.config.windowMs;

    return {
      limit: this.config.maxRequests,
      current: currentCount,
      remaining: Math.max(0, this.config.maxRequests - currentCount),
      resetTime,
    };
  }

  isLimited(status: RateLimitStatus): boolean {
    return status.current > status.limit;
  }

  async middleware(
    req: Request,
    res: Response,
    context: AuthContext,
    next: NextFunction
  ): Promise<void> {
    try {
      const status = await this.checkLimit(req, context);

      res.setHeader('X-RateLimit-Limit', status.limit);
      res.setHeader('X-RateLimit-Remaining', status.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(status.resetTime / 1000));

      if (this.isLimited(status)) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Maximum ${status.limit} requests per minute.`,
          retryAfter: Math.ceil((status.resetTime - Date.now()) / 1000),
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(error);
    }
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async getStatus(
    req: Request,
    context: AuthContext
  ): Promise<RateLimitStatus> {
    return this.checkLimit(req, context);
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export const createRateLimiter = (config?: Partial<RateLimitConfig>) => {
  return new RateLimitingPlugin(config);
};
