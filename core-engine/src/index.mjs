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

import { getSecrets } from '../config/awsSecrets.js';
import express from 'express';
import mongoose from 'mongoose';
import cluster from 'cluster';
import os from 'os';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createLogger, transports, format } from 'winston';
import { WebSocketServer } from 'ws';
import { createClient } from 'redis';
import eggRoutes from './routes/egg.routes.js';
import { logger } from './config/logger.mjs';
import { ClusterManager } from './cluster/manager.mjs';
import { WorkerManager } from './cluster/worker.mjs';
import { AIOptimizer } from './ai/optimizer.mjs';
import { PerformanceMonitor } from './performance/monitor.mjs';
import { SecurityManager } from './security/manager.mjs';
import { QuantumProcessor } from './quantum/processor.mjs';

const secrets = await getSecrets();
const numCPUs = os.cpus().length;
const PORT = parseInt(secrets.PORT, 10) || 3003;
const WS_PORT = parseInt(secrets.WS_PORT, 10) || 8081;
const MONGODB_URI = secrets.MONGODB_URI || 'mongodb://localhost:27017/bleujs';
const REDIS_HOST = secrets.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(secrets.REDIS_PORT, 10) || 6379;
const CORS_ALLOWED = secrets.CORS_ORIGINS?.split(',') || [
  'http://localhost:4002',
];

/** 📌 Logger Configuration */
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024,
    }),
    new transports.File({
      filename: 'logs/app.log',
      maxsize: 10 * 1024 * 1024,
    }),
  ],
});

/** 🔧 MongoDB Connection with Retry Logic */
async function connectToMongoDB(retries = 5) {
  while (retries > 0) {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      logger.info(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      return;
    } catch (error) {
      logger.error(
        `❌ MongoDB Connection Failed (${retries} retries left):`,
        error,
      );
      retries -= 1;
      await new Promise((res) => setTimeout(res, (6 - retries) * 2000));
    }
  }
  process.exit(1);
}

/** 📡 Redis Client */
const redisClient = createClient({
  socket: { host: REDIS_HOST, port: REDIS_PORT },
});
redisClient.on('error', (err) =>
  logger.error('❌ Redis Connection Failed:', err),
);
await redisClient.connect();

/** 🔗 WebSocket Clients */
const activeClients = new Set();

/** 📢 Broadcast Messages */
const broadcastMessage = (message, sender = null) => {
  activeClients.forEach((client) => {
    if (client !== sender && client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

/** 🔥 WebSocket Handler */
const handleWebSocket = (wss) => {
  wss.on('connection', (ws) => {
    activeClients.add(ws);
    const requestId = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    logger.info(
      `🔗 WebSocket Connected | Active Clients: ${activeClients.size} | RequestID: ${requestId}`,
    );

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (!data || typeof data !== 'object' || !data.event) {
          ws.send(
            JSON.stringify({
              error:
                "Invalid message format. Expected JSON object with 'event' field.",
            }),
          );
          return;
        }

        logger.info(`📨 WS Message Received: ${JSON.stringify(data)}`);

        switch (data.event) {
          case 'ping': {
            ws.send(JSON.stringify({ event: 'pong', timestamp: Date.now() }));
            break;
          }

          case 'generate_egg': {
            if (!data.type || !data.rarity || !data.power) {
              ws.send(
                JSON.stringify({
                  error: 'Missing fields: type, rarity, or power',
                }),
              );
              return;
            }

            const egg = {
              event: 'egg_generated',
              type: data.type,
              rarity: data.rarity,
              power: data.power,
              timestamp: Date.now(),
            };

            ws.send(JSON.stringify(egg));
            broadcastMessage(egg, ws);
            break;
          }

          case 'subscribe': {
            if (!data.category) {
              ws.send(
                JSON.stringify({
                  error: "Missing 'category' field in subscribe event.",
                }),
              );
              return;
            }
            ws.send(
              JSON.stringify({ event: 'subscribed', category: data.category }),
            );
            break;
          }

          default: {
            ws.send(JSON.stringify({ error: 'Unknown event type' }));
          }
        }
      } catch (error) {
        logger.error(`❌ WS Error: ${error.message}`);
        ws.send(JSON.stringify({ error: 'Invalid WebSocket message format.' }));
      }
    });

    ws.on('close', () => {
      activeClients.delete(ws);
      logger.info(
        `❌ WebSocket Disconnected | Active Clients: ${activeClients.size} | RequestID: ${requestId}`,
      );
    });

    ws.on('error', (error) => {
      logger.error(`🚨 WS Connection Error [${requestId}]:`, error);
    });
  });

  return wss;
};

/** 🚀 Cluster Mode */
if (cluster.isPrimary && !process.env.RUNNING_UNDER_PM2) {
  logger.info(`🚀 Master process ${process.pid} managing ${numCPUs} workers`);
  for (let i = 0; i < numCPUs; i++) cluster.fork();
  cluster.on('exit', (worker) => {
    logger.warn(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
  const wss = new WebSocketServer({ port: WS_PORT });
  handleWebSocket(wss);
} else {
  const app = express();
  await connectToMongoDB();
  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({ origin: CORS_ALLOWED, credentials: true }));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 1000,
      message: { error: 'Rate limit exceeded' },
    }),
  );
  app.get('/health', (req, res) =>
    res.status(200).json({
      status: 'healthy',
      version: '4.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  );
  app.use('/api/eggs', eggRoutes);
  app.listen(PORT, () =>
    logger.info(`🚀 API running on port ${PORT} | Worker ${process.pid}`),
  );
}

export class BleuEngine {
  constructor(options = {}) {
    this.options = {
      enableQuantum: true,
      enableAI: true,
      enableSecurity: true,
      enableClustering: true,
      numWorkers: options.numWorkers || 4,
      ...options,
    };

    this.initialized = false;
    this.components = {
      cluster: null,
      worker: null,
      ai: null,
      performance: null,
      security: null,
      quantum: null,
    };
  }

  /**
   * Initialize Bleu engine
   */
  async initialize() {
    try {
      // Initialize components based on options
      if (this.options.enableClustering) {
        this.components.cluster = new ClusterManager();
        this.components.worker = new WorkerManager();
      }

      if (this.options.enableAI) {
        this.components.ai = new AIOptimizer(process.env.OPENAI_API_KEY);
      }

      if (this.options.enableSecurity) {
        this.components.security = new SecurityManager();
      }

      if (this.options.enableQuantum) {
        this.components.quantum = new QuantumProcessor();
      }

      this.components.performance = new PerformanceMonitor();

      // Initialize all components
      await Promise.all(
        Object.values(this.components)
          .filter(Boolean)
          .map(component => component.initialize())
      );

      // Start cluster if enabled
      if (this.options.enableClustering) {
        await this.components.cluster.start({
          numWorkers: this.options.numWorkers,
        });
      }

      this.initialized = true;
      logger.info('✅ Bleu engine initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Bleu engine:', error);
      throw error;
    }
  }

  /**
   * Generate code with enhanced capabilities
   */
  async generateCode(description, options = {}) {
    try {
      if (!this.initialized) await this.initialize();

      const operationId = this.components.performance.startMonitoring('code-generation');

      try {
        // Generate code using AI
        let code;
        if (this.options.enableAI) {
          code = await this.components.ai.generateCode(description, options);
        } else {
          throw new Error('AI code generation is disabled');
        }

        // Enhance with quantum properties if enabled
        if (this.options.enableQuantum) {
          code = await this.components.quantum.enhanceCode(code);
        }

        // Validate security if enabled
        if (this.options.enableSecurity) {
          await this.components.security.validateCode(code);
        }

        // Analyze performance
        const performanceAnalysis = await this.components.performance.analyzePerformance(code);

        return {
          code,
          performance: performanceAnalysis,
          security: this.options.enableSecurity ? {
            validated: true,
            score: await this.components.security.calculateSecurityScore(code),
          } : null,
          quantum: this.options.enableQuantum ? {
            enhanced: true,
            properties: await this.components.quantum.getMetrics(),
          } : null,
        };
      } finally {
        this.components.performance.stopMonitoring(operationId);
      }
    } catch (error) {
      logger.error('❌ Code generation failed:', error);
      throw error;
    }
  }

  /**
   * Optimize code with enhanced capabilities
   */
  async optimizeCode(code, options = {}) {
    try {
      if (!this.initialized) await this.initialize();

      const operationId = this.components.performance.startMonitoring('code-optimization');

      try {
        // Optimize using AI
        let optimizedCode;
        if (this.options.enableAI) {
          optimizedCode = await this.components.ai.optimizeCode(code, options);
        } else {
          throw new Error('AI optimization is disabled');
        }

        // Enhance with quantum properties if enabled
        if (this.options.enableQuantum) {
          optimizedCode = await this.components.quantum.optimizeCode(optimizedCode);
        }

        // Validate security if enabled
        if (this.options.enableSecurity) {
          await this.components.security.validateCode(optimizedCode);
        }

        // Analyze performance
        const performanceAnalysis = await this.components.performance.analyzePerformance(optimizedCode);

        return {
          originalCode: code,
          optimizedCode,
          performance: performanceAnalysis,
          security: this.options.enableSecurity ? {
            validated: true,
            score: await this.components.security.calculateSecurityScore(optimizedCode),
          } : null,
          quantum: this.options.enableQuantum ? {
            enhanced: true,
            properties: await this.components.quantum.getMetrics(),
          } : null,
        };
      } finally {
        this.components.performance.stopMonitoring(operationId);
      }
    } catch (error) {
      logger.error('❌ Code optimization failed:', error);
      throw error;
    }
  }

  /**
   * Analyze code with enhanced capabilities
   */
  async analyzeCode(code, options = {}) {
    try {
      if (!this.initialized) await this.initialize();

      const operationId = this.components.performance.startMonitoring('code-analysis');

      try {
        // Perform AI analysis
        let aiAnalysis;
        if (this.options.enableAI) {
          aiAnalysis = await this.components.ai.analyzeCode(code);
        }

        // Perform quantum analysis if enabled
        let quantumAnalysis;
        if (this.options.enableQuantum) {
          quantumAnalysis = await this.components.quantum.analyzeCode(code);
        }

        // Perform security analysis if enabled
        let securityAnalysis;
        if (this.options.enableSecurity) {
          securityAnalysis = {
            score: await this.components.security.calculateSecurityScore(code),
            vulnerabilities: await this.components.security.validateCode(code),
          };
        }

        // Analyze performance
        const performanceAnalysis = await this.components.performance.analyzePerformance(code);

        return {
          ai: aiAnalysis,
          quantum: quantumAnalysis,
          security: securityAnalysis,
          performance: performanceAnalysis,
        };
      } finally {
        this.components.performance.stopMonitoring(operationId);
      }
    } catch (error) {
      logger.error('❌ Code analysis failed:', error);
      throw error;
    }
  }

  /**
   * Update engine settings
   */
  async updateSettings(settings) {
    try {
      this.options = {
        ...this.options,
        ...settings,
      };

      // Update component settings
      if (settings.cluster && this.components.cluster) {
        await this.components.cluster.updateSettings(settings.cluster);
      }

      if (settings.worker && this.components.worker) {
        await this.components.worker.updateSettings(settings.worker);
      }

      if (settings.ai && this.components.ai) {
        await this.components.ai.updateSettings(settings.ai);
      }

      if (settings.performance && this.components.performance) {
        await this.components.performance.updateThresholds(settings.performance);
      }

      if (settings.security && this.components.security) {
        await this.components.security.updateSettings(settings.security);
      }

      if (settings.quantum && this.components.quantum) {
        await this.components.quantum.updateSettings(settings.quantum);
      }

      logger.info('✅ Engine settings updated');
    } catch (error) {
      logger.error('❌ Failed to update engine settings:', error);
      throw error;
    }
  }

  /**
   * Get engine metrics
   */
  async getMetrics() {
    const metrics = {
      initialized: this.initialized,
      options: this.options,
      components: {},
      lastUpdate: new Date().toISOString(),
    };

    // Get metrics from each component
    for (const [name, component] of Object.entries(this.components)) {
      if (component) {
        metrics.components[name] = await component.getMetrics();
      }
    }

    return metrics;
  }

  /**
   * Stop engine
   */
  async stop() {
    try {
      // Stop cluster if enabled
      if (this.options.enableClustering && this.components.cluster) {
        await this.components.cluster.stop();
      }

      this.initialized = false;
      logger.info('✅ Bleu engine stopped');
    } catch (error) {
      logger.error('❌ Failed to stop Bleu engine:', error);
      throw error;
    }
  }
}

// Export the engine instance
export const bleu = new BleuEngine();
