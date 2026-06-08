import { Response } from 'express';
import redis, { Redis } from 'ioredis';
import axios from 'axios';

export interface SubgraphHealth {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  error?: string;
}

export interface RouterHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  redis: {
    status: 'connected' | 'disconnected';
    responseTime: number;
  };
  subgraphs: SubgraphHealth[];
}

const SUBGRAPH_URLS = [
  { name: 'user', url: 'http://localhost:4002/graphql' },
  { name: 'wallet', url: 'http://localhost:4001/graphql' },
  { name: 'transaction', url: 'http://localhost:4003/graphql' },
  { name: 'protocol', url: 'http://localhost:4004/graphql' },
  { name: 'defi', url: 'http://localhost:4005/graphql' },
  { name: 'portfolio', url: 'http://localhost:4006/graphql' },
  { name: 'fiat', url: 'http://localhost:4007/graphql' },
];

export class HealthCheckService {
  private redis: Redis;
  private subgraphHealthCache: Map<string, SubgraphHealth> = new Map();
  private routerStartTime: Date = new Date();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.redis = new redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('connect', () => {
      console.log('Health check Redis connected');
    });

    this.redis.on('error', (err) => {
      console.error('Health check Redis error:', err);
    });
  }

  async initialize(): Promise<void> {
    await this.runHealthCheck();
    
    this.healthCheckInterval = setInterval(() => {
      this.runHealthCheck().catch(console.error);
    }, 30000);
  }

  private async checkSubgraphHealth(
    name: string,
    url: string
  ): Promise<SubgraphHealth> {
    const startTime = Date.now();
    const health: SubgraphHealth = {
      name,
      url,
      status: 'unhealthy',
      responseTime: 0,
      lastCheck: new Date(),
    };

    try {
      const response = await axios.post(
        url,
        {
          query: '{ __typename }',
        },
        {
          timeout: 5000,
        }
      );

      health.responseTime = Date.now() - startTime;
      health.status = health.responseTime > 2000 ? 'degraded' : 'healthy';
      return health;
    } catch (error) {
      health.responseTime = Date.now() - startTime;
      health.status = 'unhealthy';
      health.error = error instanceof Error ? error.message : 'Unknown error';
      return health;
    }
  }

  private async checkRedisHealth(): Promise<{
    status: 'connected' | 'disconnected';
    responseTime: number;
  }> {
    const startTime = Date.now();

    try {
      await this.redis.ping();
      return {
        status: 'connected',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        responseTime: Date.now() - startTime,
      };
    }
  }

  async runHealthCheck(): Promise<void> {
    const subgraphChecks = SUBGRAPH_URLS.map(({ name, url }) =>
      this.checkSubgraphHealth(name, url)
    );

    const results = await Promise.all(subgraphChecks);
    results.forEach((health) => {
      this.subgraphHealthCache.set(health.name, health);
    });
  }

  async getHealth(): Promise<RouterHealth> {
    const redisHealth = await this.checkRedisHealth();
    const subgraphHealthArray = Array.from(this.subgraphHealthCache.values());

    const unhealthyCount = subgraphHealthArray.filter(
      (s) => s.status === 'unhealthy'
    ).length;
    const degradedCount = subgraphHealthArray.filter(
      (s) => s.status === 'degraded'
    ).length;

    let routerStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (redisHealth.status === 'disconnected' || unhealthyCount > 0) {
      routerStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      routerStatus = 'degraded';
    }

    return {
      status: routerStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.routerStartTime.getTime(),
      redis: redisHealth,
      subgraphs: subgraphHealthArray,
    };
  }

  sendHealthResponse(res: Response): void {
    this.getHealth()
      .then((health) => {
        const statusCode =
          health.status === 'healthy' ? 200 : health.status === 'degraded' ? 503 : 503;

        res.status(statusCode).json(health);
      })
      .catch((error) => {
        res.status(500).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
  }

  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    await this.redis.quit();
  }
}

export const createHealthCheckService = () => {
  return new HealthCheckService();
};
