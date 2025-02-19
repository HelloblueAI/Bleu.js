import cluster from 'cluster';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import os from 'os';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { WebSocketServer } from 'ws';

dotenv.config();

const METRICS = new Map();
const DEFAULT_PORT = 3001;
const DEFAULT_HOST = '0.0.0.0';
const CPU_CORES = os.cpus().length;
const MAX_REQUEST_SIZE = '50mb';
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;
const SHUTDOWN_TIMEOUT = 10000;
const ALLOWED_TYPES = [
  'service',
  'controller',
  'repository',
  'model',
  'interface',
  'factory',
];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'stack'] }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, metadata, stack }) => {
      const meta = metadata && metadata.requestId ? ` [${metadata.requestId}]` : '';
      const stackTrace = stack ? `\n${stack}` : '';
      return `${level.toUpperCase()} 📝 [${timestamp}]${meta}: ${message}${stackTrace}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.colorize({ all: true }),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

class MetricsSystem {
  static record(name, value, tags = {}) {
    if (typeof value !== 'number' || isNaN(value)) {
      logger.warn(`⚠️ Invalid metric value for ${name}: ${value}`);
      return;
    }

    const metricKey = `${name}_${Object.values(tags).join('_')}`;
    const current = METRICS.get(metricKey) || {
      count: 0,
      total: 0,
      min: Infinity,
      max: -Infinity,
      tags,
      lastUpdated: new Date(),
      histogram: new Map(),
    };

    current.count++;
    current.total += value;
    current.min = Math.min(current.min, value);
    current.max = Math.max(current.max, value);
    current.lastUpdated = new Date();

    // Bucket values for histogram (ensures clean ranges)
    const bucket = Math.floor(value / 100) * 100;
    current.histogram.set(bucket, (current.histogram.get(bucket) || 0) + 1);

    // Freeze object to prevent unintended mutations
    METRICS.set(metricKey, Object.freeze(current));
  }

  static getMetrics({ timeRange = 3600000 } = {}) {
    const now = Date.now();
    const results = {};

    METRICS.forEach((value, key) => {
      if (!value || typeof value !== 'object') {
        logger.warn(`⚠️ Skipping invalid metric ${key}`);
        return;
      }

      const { lastUpdated, total, count, histogram } = value;

      // Ensure values are valid before processing
      if (!lastUpdated || !(lastUpdated instanceof Date) || now - lastUpdated.getTime() > timeRange) {
        logger.warn(`⚠️ Metric ${key} has an invalid lastUpdated. Resetting timestamp.`);
        value.lastUpdated = new Date();
        return;
      }

      if (count === 0 || total === 0) {
        results[key] = { avg: 0, min: 0, max: 0, count: 0, histogram: {} };
        return;
      }

      results[key] = {
        avg: (total / count).toFixed(2),
        min: value.min,
        max: value.max,
        count: value.count,
        histogram: histogram instanceof Map ? Object.fromEntries(histogram) : {},
        p95: this.calculatePercentile(histogram, 95),
        p99: this.calculatePercentile(histogram, 99),
      };
    });

    return results;
  }

  static calculatePercentile(histogram, percentile) {
    if (!histogram || !(histogram instanceof Map) || histogram.size === 0) {
      return 0;
    }

    const sorted = Array.from(histogram.entries()).sort(([a], [b]) => a - b);
    const total = sorted.reduce((sum, [, count]) => sum + count, 0);
    const targetCount = (total * percentile) / 100;
    let currentCount = 0;

    for (const [bucket, count] of sorted) {
      currentCount += count;
      if (currentCount >= targetCount) return bucket;
    }

    return sorted[sorted.length - 1]?.[0] || 0;
  }
}



class CodeGenerator {
  static methodTemplate(name, isAsync = true) {
    return `
  ${isAsync ? 'async ' : ''}${name}(...args) {
    try {
      const startTime = performance.now();
      logger.info(\`Executing ${name}\`, { method: '${name}', args });

      // TODO: Implement ${name} logic
      const result = { success: true, method: '${name}', args };

      const duration = performance.now() - startTime;
      MetricsSystem.record('method_execution', duration, { method: '${name}' });

      return result;
    } catch (error) {
      logger.error(\`Error in ${name}: \${error.message}\`);
      MetricsSystem.record('method_error', 1, { method: '${name}' });
      throw new Error(\`Error in ${name}: \${error.message}\`);
    }
  }`;
  }

  static generateClass(type, parameters) {
    const { name, methods } = parameters;
    const uniqueMethods = [...new Set(methods)];
    const sanitizedName = this.sanitizeName(name);
    const sanitizedMethods = uniqueMethods.map(this.sanitizeMethodName);

    const classTemplate = `class ${sanitizedName} {
  constructor() {
    this.className = '${sanitizedName}';
    this.type = '${type}';
    this.createdAt = new Date().toISOString();
    this.version = 'bleu.js v.' + (process.env.BLEU_VERSION || '1.1.0');
    this.instanceId = '${uuidv4()}';

    logger.info(\`Initializing ${type} instance: \${this.className}\`, {
      className: this.className,
      type,
      instanceId: this.instanceId
    });
  }
${sanitizedMethods.map((method) => this.methodTemplate(method)).join('\n')}

  // Utility methods
  async validate() {
    return {
      isValid: true,
      className: this.className,
      type: this.type,
      methodCount: ${sanitizedMethods.length}
    };
  }

  async toJSON() {
    return {
      className: this.className,
      type: this.type,
      createdAt: this.createdAt,
      version: this.version,
      instanceId: this.instanceId,
      methods: ${JSON.stringify(sanitizedMethods)}
    };
  }

  static getInfo() {
    return {
      className: '${sanitizedName}',
      type: '${type}',
      methodCount: ${sanitizedMethods.length},
      engineVersion: '${process.env.ENGINE_VERSION || '1.1.0'}'
    };
  }
}`;

    return classTemplate;
  }

  static sanitizeName(name) {
    return name.replace(/\W/g, '');
  }

  static sanitizeMethodName(method) {
    return method.replace(/\W/g, '');
  }
}

class WebSocketManager {
  constructor() {
    this.clients = new Map();
    this.heartbeatInterval = 30000;
    this.connectionTimeout = 120000;
  }

  handleConnection(ws, req) {
    const clientId = uuidv4();
    const clientInfo = {
      id: clientId,
      ws,
      connectedAt: new Date(),
      lastHeartbeat: Date.now(),
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    this.clients.set(clientId, clientInfo);
    this.setupHeartbeat(clientId, ws);

    logger.info(`🌐 New WebSocket connection established`, {
      clientId,
      ip: clientInfo.ip,
      totalClients: this.clients.size,
    });

    return clientInfo;
  }

  setupHeartbeat(clientId, ws) {
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        const client = this.clients.get(clientId);
        if (
          client &&
          Date.now() - client.lastHeartbeat > this.connectionTimeout
        ) {
          logger.warn(`Client ${clientId} timed out`, { clientId });
          ws.terminate();
          clearInterval(pingInterval);
        } else {
          ws.ping();
        }
      }
    }, this.heartbeatInterval);

    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastHeartbeat = Date.now();
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      this.clients.delete(clientId);
      logger.info(`WebSocket connection closed`, {
        clientId,
        totalClients: this.clients.size,
      });
    });
  }

  broadcast(message, filter = null) {
    let targetClients = Array.from(this.clients.values());

    if (filter) {
      targetClients = targetClients.filter(filter);
    }

    targetClients.forEach(({ ws }) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'broadcast',
            payload: message,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    });

    return targetClients.length;
  }
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const wsManager = new WebSocketManager();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.ALLOWED_ORIGIN,
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true }));


const rateLimiter = (req, res, next) => {
  const clientIp = req.ip;
  const now = Date.now();

  const requests = METRICS.get(`ratelimit_${clientIp}`) || {
    timestamps: [],
    blocked: false,
    blockExpiry: 0,
  };

  if (requests.blocked && now < requests.blockExpiry) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      retryAfter: Math.ceil((requests.blockExpiry - now) / 1000),
    });
  }

  requests.timestamps = requests.timestamps.filter(
    (time) => now - time < RATE_LIMIT_WINDOW,
  );

  if (requests.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    requests.blocked = true;
    requests.blockExpiry = now + RATE_LIMIT_WINDOW;
    METRICS.set(`ratelimit_${clientIp}`, requests);

    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: RATE_LIMIT_WINDOW / 1000,
    });
  }

  requests.timestamps.push(now);
  METRICS.set(`ratelimit_${clientIp}`, requests);
  next();
};

// Request Tracking Middleware
const requestTracker = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  const startTime = performance.now();

  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const duration = performance.now() - startTime;
    MetricsSystem.record('http_request', duration, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });

    logger.info(`Request completed`, {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
    });
  });

  next();
};

app.use(rateLimiter);
app.use(requestTracker);

wss.on('connection', (ws, req) => {
  const clientInfo = wsManager.handleConnection(ws, req);

  ws.send(
    JSON.stringify({
      type: 'welcome',
      payload: {
        message: '🎉 Welcome to the WebSocket server!',
        clientId: clientInfo.id,
        timestamp: new Date().toISOString(),
      },
    }),
  );

  ws.on('message', (data) => {
    try {
      const parsedData = JSON.parse(data);
      logger.info(`WebSocket message received`, {
        clientId: clientInfo.id,
        messageType: parsedData.type,
      });

      MetricsSystem.record('websocket_message', 1, {
        clientId: clientInfo.id,
        messageType: parsedData.type || 'unknown',
      });

      ws.send(
        JSON.stringify({
          type: 'acknowledgment',
          payload: {
            received: parsedData,
            timestamp: new Date().toISOString(),
          },
        }),
      );
    } catch (err) {
      logger.error(`Invalid WebSocket message`, {
        clientId: clientInfo.id,
        error: err.message,
      });

      ws.send(
        JSON.stringify({
          type: 'error',
          payload: {
            error: 'Invalid message format',
            timestamp: new Date().toISOString(),
          },
        }),
      );
    }
  });

  ws.on('error', (err) => {
    logger.error(`WebSocket error`, {
      clientId: clientInfo.id,
      error: err.message,
    });
  });
});

function isValidResponse(data) {
  try {
    JSON.stringify(data);
    return true;
  } catch {
    return false;
  }
}

app.get('/api/health', async (req, res) => {
  try {
    const nodeVersion = process.version || 'unknown';
    const platform = process.platform || 'unknown';
    const healthData = {
      status: '🟢 OK',
      uptime: `${process.uptime().toFixed(2)}s`,
      timestamp: new Date().toISOString(),
      nodeVersion,
      platform,
    };

    if (!isValidResponse(healthData)) throw new Error("Invalid JSON response");

    return res.status(200).json(healthData);
  } catch (error) {
    logger.error(`❌ Health check failed: ${error.message}`);

    return res.status(500).json({
      error: 'Health check failed',
      details: error.message,
    });
  }
});




app.post('/api/generate-egg', async (req, res) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  const startTime = performance.now();

  logger.info(`[${requestId}] 🔥 Incoming request: /api/generate-egg`, { body: req.body });

  try {
    const { type, parameters } = req.body;

    if (!type || !parameters) throw new Error("Missing required fields: 'type' or 'parameters'.");
    if (!ALLOWED_TYPES.includes(type)) {
      throw new Error(`Invalid type: '${type}'. Supported types: ${ALLOWED_TYPES.join(', ')}`);
    }

    if (!parameters.name || typeof parameters.name !== 'string') {
      throw new Error("Invalid or missing 'name' parameter.");
    }
    if (!Array.isArray(parameters.methods) || parameters.methods.length === 0) {
      throw new Error("'methods' must be a non-empty array.");
    }


    const sanitizedName = CodeGenerator.sanitizeName(parameters.name);
    if (sanitizedName !== parameters.name) {
      logger.warn(`[${requestId}] ⚠️ Name sanitized`, { original: parameters.name, sanitized: sanitizedName });
    }


    const generatedCode = CodeGenerator.generateClass(type, { ...parameters, name: sanitizedName });


    const responseSize = Buffer.byteLength(JSON.stringify({ code: generatedCode }), 'utf8');
    if (responseSize > 5_000_000) {
      throw new Error("Generated response is too large. Try reducing output size.");
    }

    const duration = performance.now() - startTime;
    MetricsSystem.record('generateEgg', duration, { type, methodCount: parameters.methods.length, requestId });

    logger.info(`[${requestId}] ✅ Code generation SUCCESS`, {
      type,
      className: sanitizedName,
      methodCount: parameters.methods.length,
      duration: `${duration.toFixed(2)}ms`,
    });

    // 🔥 Return safe response
    return res.status(200).json({
      success: true,
      code: generatedCode,
      metadata: {
        requestId,
        generatedAt: new Date().toISOString(),
        duration: `${duration.toFixed(2)}ms`,
        engineVersion: process.env.ENGINE_VERSION || 'bleu.js v.1.1.0',
        type,
        className: sanitizedName,
        methodCount: parameters.methods.length,
        originalName: parameters.name !== sanitizedName ? parameters.name : undefined,
        nodeVersion: process.version,
        platform: process.platform,
        network: safeNetworkInterfaces(), // ✅ Now using the safe function
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    MetricsSystem.record('generateEggError', duration, { requestId, error: error.message });

    logger.error(`[${requestId}] ❌ Code generation FAILED`, { error: error.message, stack: error.stack });

    // Ensure a response is always sent
    return res.status(400).json({
      success: false,
      error: error.message,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        duration: `${duration.toFixed(2)}ms`,
      },
    });
  }
});


app.post('/api/broadcast', (req, res) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  const { message, filter } = req.body;

  logger.info(`[${requestId}] 🔊 Received broadcast request`, { message, filter });

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Message is required and must be a non-empty string.',
      metadata: { requestId },
    });
  }

  try {
    let filterFunction = null;

    if (filter && typeof filter === 'object') {
      filterFunction = (client) =>
        Object.entries(filter).every(([key, value]) => client[key] === value);
    }


    const recipientCount = wsManager.broadcast(message, filterFunction);

    logger.info(`[${requestId}] 📡 Broadcast message sent`, {
      recipientCount,
      messageLength: message.length,
      hasFilter: !!filter,
    });

    return res.status(200).json({
      success: true,
      message: 'Broadcast sent!',
      metadata: {
        requestId,
        recipientCount,
        timestamp: new Date().toISOString(),
        filter: filter ? Object.keys(filter) : undefined,
      },
    });
  } catch (error) {
    logger.error(`[${requestId}] ❌ Broadcast failed`, { error: error.message });

    return res.status(500).json({
      success: false,
      error: error.message,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }
});


const shutdownHandler = async (signal) => {
  logger.warn(`Received ${signal}. Initiating graceful shutdown...`);

  wsManager.broadcast({
    type: 'shutdown',
    message: 'Server is shutting down',
    signal,
  });

  try {
    const closeWSS = new Promise((resolve) => wss.close(resolve));
    const closeServer = new Promise((resolve) => server.close(resolve));


    await Promise.race([
      Promise.all([closeWSS, closeServer]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Shutdown timeout')), 10000)
      ),
    ]);

    logger.info('✅ Server closed successfully');
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Error during shutdown: ${err.message}`);
    process.exit(1);
  }
};


if (cluster.isPrimary) {
  logger.info(`Primary process v1.0.36 ${process.pid} is running`);

  for (let i = 0; i < CPU_CORES; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died`, {
      code,
      signal,
      timestamp: new Date().toISOString(),
    });

    cluster.fork();
  });

  cluster.on('message', (worker, message) => {
    if (message.type === 'metrics') {
      MetricsSystem.record(message.name, message.value, message.tags);
    }
  });

  ['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => {
      logger.warn(`Primary process received ${signal}`);


      for (const worker of Object.values(cluster.workers)) {
        worker.send({ type: 'shutdown', signal });
      }

      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, SHUTDOWN_TIMEOUT).unref();
    });
  });
} else {
  const port = process.env.PORT || DEFAULT_PORT;
  const host = process.env.HOST || DEFAULT_HOST;

  server.listen(port, host, () => {
    logger.info(`
      🚀 Worker server started
      -------------------------------------------
      🏷️ Environment:    ${process.env.NODE_ENV?.toUpperCase() || 'DEVELOPMENT'}
      🌍 Host:           ${host}
      🔌 Port:           ${port}
      🔧 Worker PID:     ${process.pid}
      🔄 CPU Cores:      ${CPU_CORES}
      📊 Engine Version: ${process.env.ENGINE_VERSION || '1.1.0'}
      -------------------------------------------
    `);
  });

  process.on('message', async (message) => {
    try {
      if (message.type === 'shutdown') {
        await shutdownHandler(message.signal);
      }
    } catch (error) {
      logger.error(`❌ Error handling process message: ${error.message}`);
    }
  });


  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', {
      error: err.message,
      stack: err.stack,
    });
    shutdownHandler('UNCAUGHT_EXCEPTION');
  });


  process.on('unhandledRejection', (reason, promise) => {
    logger.error('🛑 Unhandled Rejection', {
      reason: reason instanceof Error ? reason.stack : reason,
      promise,
    });

    if (reason instanceof Error && reason.message.includes('lookup')) {
      logger.warn('⚠️ Ignoring minor lookup error.');
    } else {
      logger.warn('⚠️ Attempting graceful shutdown due to an unhandled rejection...');
      shutdownHandler('UNHANDLED_REJECTION');
    }
  });


  setInterval(() => {
    if (process.send) {
      try {
        const metrics = MetricsSystem.getMetrics();
        process.send({
          type: 'metrics',
          metrics,
          workerId: process.pid,
        });
      } catch (error) {
        logger.warn(`⚠️ Failed to send metrics: ${error.message}`);
      }
    }
  }, 30000);

}

export { app, CodeGenerator, logger, MetricsSystem, server, wsManager, wss };
