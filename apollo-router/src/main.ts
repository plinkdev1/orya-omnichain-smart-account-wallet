import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { authPlugin, AuthContext } from './plugins/authentication';
import { createRateLimiter, RateLimitingPlugin } from './plugins/rate-limiting';
import { createHealthCheckService, HealthCheckService } from './health/health-check';

const app: Express = express();
const port = process.env.PORT || 4000;

const rateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000,
});

let healthService: HealthCheckService;

interface RequestWithContext extends Request {
  authContext?: AuthContext;
}

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost:3001',
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Apollo-Tracing', 'X-Client-Version'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 3600,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  express.json({
    limit: '50mb',
  })
);

const authMiddleware = async (
  req: RequestWithContext,
  res: Response,
  next: NextFunction
) => {
  try {
    const authContext = await authPlugin.authenticate(req);
    req.authContext = authContext;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    next(error);
  }
};

const rateLimitMiddleware = async (
  req: RequestWithContext,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.authContext) {
      req.authContext = {
        roles: [],
        isAuthenticated: false,
      };
    }

    await rateLimiter.middleware(req, res, req.authContext, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    next(error);
  }
};

app.use(authMiddleware);
app.use(rateLimitMiddleware);

app.get('/health', async (req: Request, res: Response) => {
  if (healthService) {
    healthService.sendHealthResponse(res);
  } else {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health service not initialized',
    });
  }
});

app.get('/ready', async (req: Request, res: Response) => {
  try {
    const health = await healthService.getHealth();
    if (health.status === 'healthy' || health.status === 'degraded') {
      res.status(200).json({
        ready: true,
        status: health.status,
      });
    } else {
      res.status(503).json({
        ready: false,
        status: health.status,
      });
    }
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/metrics', async (req: RequestWithContext, res: Response) => {
  try {
    authPlugin.requireRole(req.authContext || { roles: [], isAuthenticated: false }, 'admin');

    if (healthService) {
      const health = await healthService.getHealth();
      res.json(health);
    } else {
      res.status(503).json({ error: 'Health service not initialized' });
    }
  } catch (error) {
    res.status(403).json({
      error: error instanceof Error ? error.message : 'Unauthorized',
    });
  }
});

app.get('/config', (req: RequestWithContext, res: Response) => {
  try {
    authPlugin.requireRole(req.authContext || { roles: [], isAuthenticated: false }, 'admin');

    const config = {
      port,
      corsOrigins: corsOptions.origin,
      rateLimiting: {
        maxRequests: 100,
        windowMs: 60000,
      },
      environment: process.env.NODE_ENV || 'development',
      supergraph: process.env.SUPERGRAPH_PATH || './supergraph.graphql',
    };

    res.json(config);
  } catch (error) {
    res.status(403).json({
      error: error instanceof Error ? error.message : 'Unauthorized',
    });
  }
});

app.post('/graphql', async (req: RequestWithContext, res: Response) => {
  try {
    const { query, variables, operationName } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const requestPayload = {
      query,
      variables,
      operationName,
    };

    const supergraphPath = process.env.SUPERGRAPH_PATH || path.join(__dirname, '..', 'supergraph.graphql');
    
    if (!fs.existsSync(supergraphPath)) {
      return res.status(500).json({
        error: 'Supergraph schema not found',
        path: supergraphPath,
      });
    }

    res.json({
      data: null,
      errors: [
        {
          message: 'GraphQL proxy should be handled by Apollo Router process. Use rover dev or apollo rover.',
        },
      ],
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

app.get('/schema', async (req: RequestWithContext, res: Response) => {
  try {
    authPlugin.requireAuth(req.authContext || { roles: [], isAuthenticated: false });

    const supergraphPath = process.env.SUPERGRAPH_PATH || path.join(__dirname, '..', 'supergraph.graphql');
    
    if (!fs.existsSync(supergraphPath)) {
      return res.status(404).json({
        error: 'Supergraph schema not found',
      });
    }

    const schema = fs.readFileSync(supergraphPath, 'utf-8');
    res.type('text/plain').send(schema);
  } catch (error) {
    res.status(403).json({
      error: error instanceof Error ? error.message : 'Unauthorized',
    });
  }
});

app.get('/subgraphs', async (req: RequestWithContext, res: Response) => {
  try {
    authPlugin.requireAuth(req.authContext || { roles: [], isAuthenticated: false });

    const health = await healthService.getHealth();
    const subgraphInfo = health.subgraphs.map((sg) => ({
      name: sg.name,
      url: sg.url,
      status: sg.status,
      responseTime: sg.responseTime,
      lastCheck: sg.lastCheck,
    }));

    res.json(subgraphInfo);
  } catch (error) {
    res.status(403).json({
      error: error instanceof Error ? error.message : 'Unauthorized',
    });
  }
});

const errorHandler = (
  err: Error,
  req: RequestWithContext,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
};

app.use(errorHandler);

const startServer = async () => {
  try {
    healthService = createHealthCheckService();
    await healthService.initialize();

    app.listen(port, () => {
      console.log(`🚀 Apollo Router listening on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🔍 Metrics: http://localhost:${port}/metrics`);
      console.log(`📋 Schema: http://localhost:${port}/schema`);
      console.log(`🔌 Subgraphs: http://localhost:${port}/subgraphs`);
      console.log(`⚙️  Config: http://localhost:${port}/config`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  if (healthService) {
    await healthService.shutdown();
  }
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();

export { app };
