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

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console(),
  
  // Error log file transport
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
  }),
  
  // Combined log file transport
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
});

// Add request logging middleware
export const requestLogger = (req, res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
};

// Add error logging middleware
export const errorLogger = (err, req, res, next) => {
  logger.error(err.stack);
  next(err);
};

// Add performance logging middleware
export const performanceLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`Request completed in ${duration}ms`);
  });
  next();
};

// Add security logging middleware
export const securityLogger = (req, res, next) => {
  const securityInfo = {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  };
  
  logger.info('Security event:', securityInfo);
  next();
};

// Add cluster logging middleware
export const clusterLogger = (worker) => {
  logger.info(`Worker ${worker.id} started`);
  
  worker.on('message', (message) => {
    logger.debug(`Message from worker ${worker.id}:`, message);
  });
  
  worker.on('error', (error) => {
    logger.error(`Error in worker ${worker.id}:`, error);
  });
  
  worker.on('exit', (code) => {
    logger.warn(`Worker ${worker.id} exited with code ${code}`);
  });
};

// Add AI logging middleware
export const aiLogger = (operation, data) => {
  logger.info(`AI operation: ${operation}`, {
    timestamp: new Date().toISOString(),
    data,
  });
};

// Add quantum logging middleware
export const quantumLogger = (operation, data) => {
  logger.info(`Quantum operation: ${operation}`, {
    timestamp: new Date().toISOString(),
    data,
  });
};

// Add performance metrics logging
export const metricsLogger = (metrics) => {
  logger.debug('Performance metrics:', {
    timestamp: new Date().toISOString(),
    metrics,
  });
};

// Add security metrics logging
export const securityMetricsLogger = (metrics) => {
  logger.info('Security metrics:', {
    timestamp: new Date().toISOString(),
    metrics,
  });
};

// Add cluster metrics logging
export const clusterMetricsLogger = (metrics) => {
  logger.info('Cluster metrics:', {
    timestamp: new Date().toISOString(),
    metrics,
  });
};

// Export logger instance
export { logger };
