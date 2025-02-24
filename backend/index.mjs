//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

import os from 'os';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';

import { spawn } from 'child_process';

import fs from 'fs';

import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import promClient from 'prom-client';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERSION = process.env.npm_package_version || '1.0.0';
const BUILD_NUMBER = process.env.BUILD_NUMBER || '0';
const PORT = process.env.PORT || 5005;
const MONGODB_URI = process.env.MONGODB_URI || '';
const INSTANCE_ID = process.env.NODE_APP_INSTANCE || '0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const SECURITY_CONFIG = {
  MAX_REQUEST_SIZE: '5mb',
  RATE_LIMIT_WINDOW: 15 * 60 * 1000,
  RATE_LIMIT_MAX: NODE_ENV === 'production' ? 100 : 1000,
  CONNECTION_TIMEOUT: 10000,
  MONGOOSE_MAX_RETRIES: 5,
  MONGOOSE_RETRY_INTERVAL: 5000,
};

const CORS_WHITELIST = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

const collectDefaultMetrics = promClient.collectDefaultMetrics;
const Registry = promClient.Registry;
const register = new Registry();
collectDefaultMetrics({ register });

const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

class EnhancedCache extends Map {
  constructor() {
    super();
    this.hits = 0;
    this.misses = 0;
    this.maxSize = 1000;
  }

  set(key, value, ttl = CACHE_TTL) {
    if (this.size >= this.maxSize) {
      const oldestKey = this.keys().next().value;
      this.delete(oldestKey);
    }

    const expiryTime = Date.now() + ttl;
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    super.set(hash, {
      value,
      expiryTime,
      created: Date.now(),
      hits: 0,
    });

    setTimeout(() => this.delete(hash), ttl);
  }

  get(key) {
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const data = super.get(hash);

    if (data && data.expiryTime > Date.now()) {
      data.hits++;
      this.hits++;
      return data.value;
    }

    this.misses++;
    this.delete(hash);
    return undefined;
  }

  getStats() {
    return {
      size: this.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
    };
  }
}

class CircuitBreaker {
  constructor(failureThreshold = 5, resetTimeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.failures = 0;
    this.isOpen = false;
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.isOpen) {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.isOpen = false;
        this.failures = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      if (this.failures >= this.failureThreshold) {
        this.isOpen = true;
      }
      throw error;
    }
  }
}

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, instance, stack }) => {
      return JSON.stringify({
        timestamp,
        level,
        instance: INSTANCE_ID,
        message,
        stack,
      });
    }),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.colorize({ all: true }),
    }),
    new winston.transports.File({
      filename: `logs/error-${INSTANCE_ID}.log`,
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: `logs/combined-${INSTANCE_ID}.log`,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

const predictionCache = new EnhancedCache();

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: NODE_ENV === 'production',
    crossOriginEmbedderPolicy: NODE_ENV === 'production',
  }),
);
app.use(compression());
app.use(express.json({ limit: SECURITY_CONFIG.MAX_REQUEST_SIZE }));
app.use(
  cors({
    origin: NODE_ENV === 'production' ? CORS_WHITELIST : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  }),
);

const requestTracker = async (req, res, next) => {
  const requestStart = Date.now();
  const requestId = crypto.randomUUID();

  req.id = requestId;
  res.locals.requestStart = requestStart;

  res.on('finish', () => {
    const duration = Date.now() - requestStart;
    logger.info('Request completed', {
      id: requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
  });

  next();
};

app.use(requestTracker);

app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.path === '/metrics' || req.path === '/health',
  }),
);

const validApiKeys = new Map([
  [process.env.API_KEY_1 || 'your-api-key-1', true],
  [process.env.API_KEY_2 || 'your-api-key-2', true],
]);

const authMiddleware = (req, res, next) => {
  if (req.path === '/health' || req.path === '/metrics') {
    return next();
  }

  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !validApiKeys.has(apiKey)) {
    logger.warn(`Unauthorized access attempt from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  next();
};

app.use(authMiddleware);

const rateLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW,
  max: SECURITY_CONFIG.RATE_LIMIT_MAX,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(rateLimiter);

async function connectMongoDB() {
  if (!MONGODB_URI) {
    logger.error('MongoDB URI is missing');
    process.exit(1);
  }

  const connectWithRetry = async (
    retries = SECURITY_CONFIG.MONGOOSE_MAX_RETRIES,
    interval = SECURITY_CONFIG.MONGOOSE_RETRY_INTERVAL,
  ) => {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        autoIndex: NODE_ENV !== 'production',
        maxPoolSize: 10,
      });
      logger.info('MongoDB connected successfully');
    } catch (error) {
      if (retries > 0) {
        logger.warn(
          `MongoDB connection failed, retrying... (${retries} attempts left)`,
        );
        setTimeout(() => connectWithRetry(retries - 1, interval), interval);
      } else {
        logger.error('MongoDB connection failed after all retries');
        process.exit(1);
      }
    }
  };

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected, attempting to reconnect...');
    connectWithRetry();
  });

  mongoose.connection.on('error', (error) => {
    logger.error(`MongoDB connection error: ${error.message}`);
  });

  await connectWithRetry();
}

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error(`Metrics generation error: ${error.message}`);
    res.status(500).end();
  }
});

app.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'success',
      service: {
        name: 'Bleu.js Backend',
        version: VERSION,
        build: BUILD_NUMBER,
        nodeVersion: process.version,
        instance: INSTANCE_ID,
        uptime: process.uptime(),
      },
      server: {
        environment: NODE_ENV,
        port: PORT,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      database: {
        status:
          mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host,
        databaseName: mongoose.connection.name,
      },
      resources: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        loadAverage: os.loadavg(),
      },
      cache: predictionCache.getStats(),
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

const predictionBreaker = new CircuitBreaker();

app.post('/predict', async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  try {
    const { features } = req.body;

    if (!Array.isArray(features) || !features.length) {
      logger.warn('Invalid prediction request format');
      return res
        .status(400)
        .json({ status: 'error', message: 'Invalid input format' });
    }

    const cacheKey = JSON.stringify(features);
    const cachedResult = predictionCache.get(cacheKey);

    if (cachedResult) {
      logger.info(`Cache hit for prediction: ${cacheKey}`);
      end({ method: 'POST', route: '/predict', status_code: 200 });
      return res
        .status(200)
        .json({ status: 'success', prediction: cachedResult, cached: true });
    }

    await predictionBreaker.execute(async () => {
      const scriptPath = path.join(__dirname, 'xgboost_predict.py');
      if (!fs.existsSync(scriptPath)) {
        throw new Error('Prediction script not found');
      }

      const pythonProcess = spawn('python3', [
        scriptPath,
        JSON.stringify(features),
      ]);
      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on(
        'data',
        (data) => (output += data.toString().trim()),
      );
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString().trim();
        logger.error(`Python error: ${data.toString().trim()}`);
      });

      return new Promise((resolve, reject) => {
        pythonProcess.on('close', (code) => {
          if (code === 0 && output.trim()) {
            try {
              const parsedOutput = JSON.parse(output.trim());
              predictionCache.set(cacheKey, parsedOutput);
              end({ method: 'POST', route: '/predict', status_code: 200 });
              resolve(
                res.status(200).json({
                  status: 'success',
                  prediction: parsedOutput,
                  cached: false,
                }),
              );
            } catch (error) {
              reject(new Error('Failed to parse prediction result'));
            }
          } else {
            reject(new Error(`Prediction failed: ${errorOutput}`));
          }
        });
      });
    });
  } catch (error) {
    logger.error(`Prediction error: ${error.message}`);
    end({ method: 'POST', route: '/predict', status_code: 500 });
    res.status(500).json({
      status: 'error',
      message:
        NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  }
});

app.use((err, req, res, next) => {
  const errorId = crypto.randomUUID();

  logger.error('Unhandled error', {
    errorId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.id,
  });

  res.status(err.status || 500).json({
    status: 'error',
    message: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    errorId,
    timestamp: new Date().toISOString(),
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, starting graceful shutdown');
  server.close(async () => {
    logger.info('HTTP server closed');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  connectMongoDB();
});

export default app;
