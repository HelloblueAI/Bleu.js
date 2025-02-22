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

export const DEFAULT_PORT = 3001;
export const DEFAULT_HOST = '0.0.0.0';
export const CPU_CORES = os.cpus().length;
export const ENVIRONMENT = process.env.NODE_ENV || 'development';
export const VERSION = process.env.ENGINE_VERSION || '1.1.0';
export const MAX_REQUEST_SIZE = '50mb';
export const REQUEST_TIMEOUT = 30000;
export const RATE_LIMIT_WINDOW = 60000;
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const RATE_LIMIT_WHITELIST = ['127.0.0.1', 'localhost'];
export const WS_HEARTBEAT_INTERVAL = 30000;
export const WS_CONNECTION_TIMEOUT = 120000;
export const WS_MAX_PAYLOAD_SIZE = 5242880;
export const SHUTDOWN_TIMEOUT = 10000;
export const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT'];
export const CIRCUIT_BREAKER_OPTIONS = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 10000,
  resetTimeout: 60000,
};

export const ALLOWED_TYPES = [
  'service',
  'controller',
  'repository',
  'model',
  'interface',
  'factory',
];

export const METRICS_INTERVAL = 30000;
export const METRICS_RETENTION = 3600000;

export const CORS_OPTIONS = {
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.ALLOWED_ORIGIN,
  ].filter(Boolean),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86400,
};

export const LOG_CONFIG = {
  maxSize: 5242880, // 5MB
  maxFiles: 5,
  directory: 'logs',
};

export const VALIDATION = {
  maxNameLength: 50,
  maxMethodsPerClass: 50,
  maxResponseSize: 5_000_000,
  methodNamePattern: /^[a-zA-Z]\w*$/,
};

export const SECURITY = {
  maxTokenAge: 3600,
  bcryptRounds: 10,
  minPasswordLength: 8,
};

export const CACHE = {
  ttl: 300,
  checkPeriod: 600,
};
