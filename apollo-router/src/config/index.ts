import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '4000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
  },

  apollo: {
    graphRef: process.env.APOLLO_GRAPH_REF || 'orya-wallet@current',
    key: process.env.APOLLO_KEY,
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:19006,http://localhost:3001,http://localhost:5173').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Apollo-Tracing', 'X-Client-Version'],
    exposedHeaders: [
      'Content-Length',
      'Content-Type',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 3600,
  },

  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  },

  supergraph: {
    path: process.env.SUPERGRAPH_PATH || './supergraph.graphql',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  features: {
    tracing: process.env.ENABLE_TRACING === 'true',
    metrics: process.env.ENABLE_METRICS === 'true',
  },

  subgraphs: [
    {
      name: 'user',
      url: 'http://localhost:4002/graphql',
      routingUrl: 'http://localhost:4002/graphql',
    },
    {
      name: 'wallet',
      url: 'http://localhost:4001/graphql',
      routingUrl: 'http://localhost:4001/graphql',
    },
    {
      name: 'transaction',
      url: 'http://localhost:4003/graphql',
      routingUrl: 'http://localhost:4003/graphql',
    },
    {
      name: 'protocol',
      url: 'http://localhost:4004/graphql',
      routingUrl: 'http://localhost:4004/graphql',
    },
    {
      name: 'defi',
      url: 'http://localhost:4005/graphql',
      routingUrl: 'http://localhost:4005/graphql',
    },
    {
      name: 'portfolio',
      url: 'http://localhost:4006/graphql',
      routingUrl: 'http://localhost:4006/graphql',
    },
    {
      name: 'fiat',
      url: 'http://localhost:4007/graphql',
      routingUrl: 'http://localhost:4007/graphql',
    },
  ],
};

export function validateConfig(): string[] {
  const errors: string[] = [];

  if (!config.apollo.key && config.server.isProduction) {
    errors.push('APOLLO_KEY is required in production');
  }

  if (!config.firebase.projectId && config.server.isProduction) {
    errors.push('FIREBASE_PROJECT_ID is recommended in production');
  }

  if (config.redis.host === 'localhost' && config.server.isProduction) {
    errors.push('Redis should point to a proper Redis server in production');
  }

  return errors;
}

export function logConfig(): void {
  console.log('🚀 Configuration loaded:');
  console.log(`   Environment: ${config.server.nodeEnv}`);
  console.log(`   Port: ${config.server.port}`);
  console.log(`   Redis: ${config.redis.host}:${config.redis.port}`);
  console.log(`   CORS Origins: ${config.cors.origins.join(', ')}`);
  console.log(`   Rate Limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs}ms`);
  console.log(`   Subgraphs: ${config.subgraphs.length}`);
}
