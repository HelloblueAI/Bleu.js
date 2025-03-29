import express from 'express';
import mongoose from 'mongoose';
import { Logger } from '../utils/logger';
import { BleuConfig } from '../types/config';
import { SecurityManager } from '../security/securityManager';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import cors from 'cors';
import helmet from 'helmet';
import { MongoClient } from 'mongodb';

export class Bleu {
  private app: express.Application;
  private logger: Logger;
  private config: BleuConfig;
  private securityManager: SecurityManager;
  private mongoClient?: MongoClient;
  private server?: any;
  private rateLimiter: RateLimiterMemory;
  private isRunning: boolean = false;

  constructor(config: BleuConfig, logger: Logger) {
    this.app = express();
    this.logger = logger;
    this.config = {
      ...config,
      security: {
        ...config.security,
        cors: {
          enabled: true,
          origin: '*',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          ...config.security?.cors
        }
      }
    };
    this.securityManager = new SecurityManager(this.config.security, this.logger);
    this.rateLimiter = new RateLimiterMemory({
      points: this.config.security.rateLimit.max,
      duration: this.config.security.rateLimit.windowMs / 1000
    });
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    if (this.config.security.cors.enabled) {
      this.app.use(cors(this.config.security.cors));
    }

    // Rate limiting
    this.app.use((req, res, next) => {
      this.rateLimiter.consume(req.ip)
        .then(() => next())
        .catch(() => {
          res.status(429).json({
            error: 'Too many requests. Please try again later.'
          });
        });
    });

    // Request validation
    this.app.use(this.securityManager.validateRequest);

    // Error handling
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error('Error:', err);
      res.status(500).json({
        error: this.config.environment === 'development' ? err.message : 'Internal server error'
      });
    });

    // Request logging
    this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.info('Request:', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      next();
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Server is already running');
      return;
    }

    try {
      // Connect to MongoDB if configured
      if (this.config.database?.mongodb) {
        await mongoose.connect(this.config.database.mongodb.uri, {
          ...this.config.database.mongodb.options,
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        this.logger.info('Connected to MongoDB');
      }

      // Start server
      const port = this.config.server?.port || 3000;
      this.server = this.app.listen(port, () => {
        this.isRunning = true;
        this.logger.info(`Server running on port ${port}`);
      });
    } catch (error) {
      this.logger.error('Failed to start server', error);
      await this.cleanup();
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Server is not running');
      return;
    }

    try {
      // Disconnect from MongoDB
      await mongoose.disconnect();
      this.logger.info('Disconnected from MongoDB');

      // Close server
      this.isRunning = false;
      this.logger.info('Server stopped');
    } catch (error) {
      this.logger.error('Failed to stop server', error);
      throw error;
    }
  }

  getApp(): express.Application {
    return this.app;
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }

  getConfig(): BleuConfig {
    return this.config;
  }
}