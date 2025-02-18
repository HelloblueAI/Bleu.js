import express from 'express';
import cors from 'cors';
import winston from 'winston';
import bodyParser from 'body-parser';
import cluster from 'cluster';
import os from 'os';
import { performance } from 'perf_hooks';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

const CONFIG = {
  METRICS_INTERVAL: 5000,
  CPU_CORES: os.cpus().length,
  DEFAULT_PORT: 3001,
  LOG_ROTATION_SIZE: 5 * 1024 * 1024,
  LOG_MAX_FILES: 5,
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
  CORS_MAX_AGE: 24 * 60 * 60,
};

class AppError extends Error {
  constructor(statusCode, message, code, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.metadata({
      fillExcept: ['message', 'level', 'timestamp', 'stack'],
    }),
    winston.format.printf(({ timestamp, level, message, metadata, stack }) => {
      const meta = Object.keys(metadata).length
        ? `\n${JSON.stringify(metadata, null, 2)}`
        : '';
      return `[${timestamp}] ${level.padEnd(7)}: ${message}${stack ? '\n' + stack : ''}${meta}`;
    }),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: CONFIG.LOG_ROTATION_SIZE,
      maxFiles: CONFIG.LOG_MAX_FILES,
      tailable: true,
      zippedArchive: true,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: CONFIG.LOG_ROTATION_SIZE,
      maxFiles: CONFIG.LOG_MAX_FILES,
      tailable: true,
      zippedArchive: true,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

if (cluster.isPrimary) {
  logger.info(`🚀 Primary ${process.pid} is running`);

  const gracefulShutdown = () => {
    logger.info('Received shutdown signal. Gracefully shutting down...');

    for (const id in cluster.workers) {
      cluster.workers[id]?.send('shutdown');
    }

    setTimeout(() => {
      logger.warn('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  for (let i = 0; i < CONFIG.CPU_CORES; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(
      `Worker ${worker.process.pid} died (${signal || code}). Restarting...`,
    );
    cluster.fork();
  });
} else {
  class PerformanceMonitor {
    constructor(snapshotInterval = CONFIG.METRICS_INTERVAL) {
      this.metrics = new Map();
      this.snapshotInterval = snapshotInterval;
      this.snapshots = [];
      this.startSnapshotting();
    }

    startSnapshotting() {
      setInterval(() => {
        const metrics = this.getMetrics();
        this.snapshots.push({
          timestamp: Date.now(),
          metrics,
        });

        const oneHourAgo = Date.now() - 3600000;
        this.snapshots = this.snapshots.filter((s) => s.timestamp > oneHourAgo);
      }, this.snapshotInterval);
    }

    recordMetric(name, value, tags = {}) {
      const key = this.createMetricKey(name, tags);
      const current = this.metrics.get(key) || {
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
      };

      current.count++;
      current.sum += value;
      current.min = Math.min(current.min, value);
      current.max = Math.max(current.max, value);
      this.metrics.set(key, current);
    }

    createMetricKey(name, tags) {
      const tagString = Object.entries(tags)
        .sort(([k1], [k2]) => k1.localeCompare(k2))
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
      return tagString ? `${name}{${tagString}}` : name;
    }

    getMetrics() {
      const result = {};
      for (const [key, value] of this.metrics.entries()) {
        result[key] = {
          avg: value.sum / value.count,
          min: value.min,
          max: value.max,
          count: value.count,
        };
      }
      return result;
    }

    getHistoricalMetrics(duration = 3600000) {
      const since = Date.now() - duration;
      return this.snapshots.filter((s) => s.timestamp > since);
    }
  }

  class TemplateEngine {
    constructor() {
      this.templates = new Map();
      this.helpers = new Map();
      this.cache = new Map();
      this.cacheTTL = 300000;
      this.registerDefaultHelpers();
    }

    registerDefaultHelpers() {
      this.helpers.set('formatDate', (date) => new Date(date).toISOString());
      this.helpers.set(
        'capitalize',
        (str) => str.charAt(0).toUpperCase() + str.slice(1),
      );
      this.helpers.set('pluralize', (str) => `${str}s`);
      this.helpers.set('sanitize', (str) => {
        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '/': '&#x2F;',
        };
        return str.replace(/[&<>"'/]/gi, (match) => map[match]);
      });
    }

    registerTemplate(name, template, validate) {
      this.templates.set(name, async (context, helpers) => {
        if (validate && !validate(context)) {
          throw new AppError(
            400,
            'Invalid template context',
            'INVALID_TEMPLATE_CONTEXT',
          );
        }
        return template(context, helpers);
      });
    }

    async render(name, context) {
      const template = this.templates.get(name);
      if (!template) {
        throw new AppError(
          404,
          `Template ${name} not found`,
          'TEMPLATE_NOT_FOUND',
        );
      }

      const cacheKey = this.generateCacheKey(name, context);
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        monitor.recordMetric('template.cache.hit', 1);
        return cached.result;
      }

      const startTime = performance.now();
      try {
        const result = await template(context, this.helpers);
        const duration = performance.now() - startTime;

        monitor.recordMetric('template.render.duration', duration, {
          template: name,
          cached: 'false',
        });

        this.cache.set(cacheKey, {
          result,
          timestamp: Date.now(),
        });

        return result;
      } catch (error) {
        logger.error(`Template rendering failed: ${error.message}`, {
          name,
          context,
          error: error.stack,
        });
        throw error;
      }
    }

    generateCacheKey(name, context) {
      return `${name}:${JSON.stringify(context)}`;
    }
  }

  const monitor = new PerformanceMonitor();
  const templateEngine = new TemplateEngine();

  templateEngine.registerTemplate(
    'service',
    async (context, helpers) => {
      return `
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { Meter, Counter, Histogram } from '@opentelemetry/metrics';
import { Tracer } from '@opentelemetry/tracing';
import { CircuitBreaker } from '@nestjs/circuit-breaker';
import { Validator } from 'class-validator';
import { RetryPolicy } from '@nestjs/retry';

@Injectable()
export class ${helpers.get('capitalize')(context.name)}Service implements OnModuleInit {
  constructor(
    @InjectRepository(${context.name})
    private readonly repository: Repository<${context.name}>,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    private readonly tracingService: TracingService,
  ) {
    this.initializeServices();
  }

  ${context.methods
    .map(
      (method) => `
  async ${method}(data) {
    const startTime = performance.now();
    try {
      // Execute operation with validation and caching
      const result = await this.repository.${method}(data);

      const duration = performance.now() - startTime;
      return {
        success: true,
        data: result,
        metadata: {
          duration,
          timestamp: new Date(),
          cached: false
        }
      };
    } catch (error) {
      throw error;
    }
  }`,
    )
    .join('\n\n')}
}`;
    },
    (context) => {
      return Boolean(
        context.name &&
          Array.isArray(context.methods) &&
          context.methods.every((m) => typeof m === 'string'),
      );
    },
  );

  const app = express();
  const port = process.env.PORT || CONFIG.DEFAULT_PORT;

  app.use(helmet());
  app.use(compression());
  app.use(rateLimit(CONFIG.RATE_LIMIT));

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: CONFIG.CORS_MAX_AGE,
    }),
  );

  app.use((req, res, next) => {
    const requestId = uuidv4();
    const startTime = performance.now();

    req.context = {
      requestId,
      startTime,
      logger: logger.child({ requestId }),
    };

    res.on('finish', () => {
      const duration = performance.now() - startTime;
      monitor.recordMetric('http.response.time', duration, {
        method: req.method,
        status: res.statusCode.toString(),
        path: req.path,
      });
    });

    next();
  });

  app.use((err, req, res, next) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
        metadata: {
          requestId: req.context?.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      logger.error('Unhandled error', { error: err.stack });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
        metadata: {
          requestId: req.context?.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  app.post('/api/generate-egg', async (req, res, next) => {
    const startTime = performance.now();
    try {
      const { type, parameters } = req.body;

      if (!type || !parameters) {
        throw new AppError(400, 'Missing required fields', 'INVALID_REQUEST');
      }

      const code = await templateEngine.render(type, parameters);
      const duration = performance.now() - startTime;

      monitor.recordMetric('code.generation.time', duration, {
        template: type,
      });

      res.json({
        success: true,
        code,
        metadata: {
          generatedAt: new Date().toISOString(),
          requestId: req.context?.requestId,
          engineVersion: '1.0.32',
          generationTime: `${duration.toFixed(2)}ms`,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      metrics: {
        current: monitor.getMetrics(),
        historical: monitor.getHistoricalMetrics(),
      },
      timestamp: new Date().toISOString(),
      version: '1.0.32',
    });
  });

  const server = app.listen(port, () => {
    logger.info(`🚀 BleuJS Core Engine v1.0.32 running on port ${port}`);
  });

  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      logger.info('Worker received shutdown signal');

      server.close(() => {
        logger.info('Worker gracefully shut down');
        process.exit(0);
      });
    }
  });
}

export default app;
