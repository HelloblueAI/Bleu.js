import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { logger } from '../utils/logger';
import { SecurityManager } from '../security/securityManager';

export interface BleuConfig {
  core?: {
    port?: number;
    environment?: string;
    mongoUri?: string;
    rateLimitWindow?: number;
    rateLimitMax?: number;
  };
  security?: {
    enabled?: boolean;
    encryptionKey?: string;
  };
  monitoring?: {
    enabled?: boolean;
    interval?: number;
  };
}

export class Bleu {
  private app: express.Application;
  private server: http.Server | null = null;
  private securityManager: SecurityManager;
  private isShuttingDown: boolean = false;
  private config: BleuConfig;

  constructor(config: Partial<BleuConfig> = {}) {
    this.config = {
      core: {
        port: config.core?.port || 3000,
        environment: config.core?.environment || 'development',
        mongoUri: config.core?.mongoUri || 'mongodb://localhost:27017/bleu',
        rateLimitWindow: config.core?.rateLimitWindow || 15 * 60 * 1000,
        rateLimitMax: config.core?.rateLimitMax || 100
      },
      security: {
        enabled: config.security?.enabled ?? true,
        encryptionKey: config.security?.encryptionKey || 'default-key'
      },
      monitoring: {
        enabled: config.monitoring?.enabled ?? true,
        interval: config.monitoring?.interval || 60000
      }
    };

    this.app = express();
    this.securityManager = new SecurityManager(this.config.security);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    if (this.config.security.enabled) {
      this.app.use(this.securityManager.getMiddleware());
    }
  }

  private setupRoutes(): void {
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok' });
    });
  }

  private setupErrorHandling(): void {
    this.app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  async start(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        if (this.config.core.mongoUri) {
          mongoose.connect(this.config.core.mongoUri)
            .then(() => {
              logger.info('Connected to MongoDB');
            })
            .catch((error) => {
              logger.error('MongoDB connection error:', error);
              reject(error);
            });
        }

        this.server = this.app.listen(this.config.core.port, () => {
          logger.info(`Server started on port ${this.config.core.port}`);
          resolve();
        });

        this.server.on('error', (error) => {
          logger.error('Server failed to start:', error);
          reject(error);
        });

        process.on('SIGTERM', () => this.stop());
        process.on('SIGINT', () => this.stop());
      } catch (error) {
        logger.error('Error during server startup:', error);
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info('Shutting down server...');

    return new Promise<void>((resolve, reject) => {
      try {
        if (this.server) {
          this.server.close(async () => {
            try {
              if (mongoose.connection.readyState === 1) {
                await mongoose.disconnect();
                logger.info('Disconnected from MongoDB');
              }
              logger.info('Server stopped');
              resolve();
            } catch (error) {
              logger.error('Error during cleanup:', error);
              reject(error);
            }
          });
        } else {
          resolve();
        }
      } catch (error) {
        logger.error('Error during server shutdown:', error);
        reject(error);
      }
    });
  }

  getApp(): express.Application {
    return this.app;
  }

  getConfig(): BleuConfig {
    return this.config;
  }
}