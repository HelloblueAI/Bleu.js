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
import { json } from 'body-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import winston from 'winston';
import expressWinston from 'express-winston';

import {
  monitorDependencies,
  resolveConflicts,
  DependencyError,
} from './dependencyManager';

const app = express();
const port = process.env.PORT || 3002;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4002';


const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'dependency-management' },
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
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});


app.use(helmet());
app.use(json());


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);


app.use(
  cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);


app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: true,
  }),
);


app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});


app.get('/health', (req, res) => {
  res
    .status(200)
    .json({ status: 'healthy', timestamp: new Date().toISOString() });
});


app.get('/api/dependencies', async (req, res) => {
  try {
    const options = {
      includeDevDependencies: req.query.includeDev === 'true',
      projectPath: req.query.path,
    };

    const result = await monitorDependencies(options);
    logger.info('Dependencies monitored successfully', {
      totalDependencies: result.dependencies.length,
      outdatedCount: result.outdated.length,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error monitoring dependencies', {
      error: error.message,
      code: error instanceof DependencyError ? error.code : 'UNKNOWN_ERROR',
    });

    return res.status(error instanceof DependencyError ? 400 : 500).json({
      error: error.message,
      code: error instanceof DependencyError ? error.code : 'UNKNOWN_ERROR',
    });
  }
});

app.get('/api/dependencies/conflicts', async (req, res) => {
  try {
    const options = {
      projectPath: req.query.path,
      autoResolve: req.query.autoResolve === 'true',
    };

    const result = await resolveConflicts(options);
    logger.info('Conflicts resolved successfully', {
      totalConflicts: result.conflicts.length,
      resolvedCount: result.resolved.length,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error resolving conflicts', {
      error: error.message,
      code: error instanceof DependencyError ? error.code : 'UNKNOWN_ERROR',
    });

    return res.status(error instanceof DependencyError ? 400 : 500).json({
      error: error.message,
      code: error instanceof DependencyError ? error.code : 'UNKNOWN_ERROR',
    });
  }
});


const server = app.listen(port, () => {
  logger.info(`Dependency Management Service running on port ${port}`);
});


process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
