import express, { Router, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createLogger } from '../utils/logger';
import { Monitor } from '../monitoring/monitor';
import { BleuAI } from '../ai/bleuAI';
import { QuantumEnhancer } from '../ai/multimodal/enhancers/quantumEnhancer';
import { ModelConfig, DeploymentStatus } from '../types';
import { DeploymentError } from '../types/errors';
import { Config } from '../config/config';
import { SecurityManager } from '../security/securityManager';

export class ModelDeployer {
  private readonly app: express.Application;
  private readonly logger = createLogger('ModelDeployer');
  private readonly config: Config;
  private readonly monitor: Monitor;
  private readonly bleuAI: BleuAI;
  private readonly quantumEnhancer: QuantumEnhancer;
  private readonly securityManager: SecurityManager;
  private readonly deployedModels: Map<string, ModelConfig>;
  private readonly deployments: Map<string, DeploymentStatus>;
  private server: express.Server | null = null;
  private readonly port: number;
  private initialized = false;

  constructor(config: Config = {}) {
    this.config = {
      server: {
        port: config.server?.port || 3000,
        cors: {
          allowedOrigins: config.server?.cors?.allowedOrigins || ['*'],
          allowedMethods: config.server?.cors?.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE'],
          allowedHeaders: config.server?.cors?.allowedHeaders || ['Content-Type', 'Authorization']
        }
      },
      monitoring: {
        interval: config.monitoring?.interval || 60000,
        alertThresholds: config.monitoring?.alertThresholds || {
          errorRate: { warning: 0.1, critical: 0.2 },
          latency: { warning: 1000, critical: 2000 },
          memory: { warning: 0.8, critical: 0.9 }
        },
        retentionPeriod: config.monitoring?.retentionPeriod || 7 * 24 * 60 * 60 * 1000,
        maxMetrics: config.monitoring?.maxMetrics || 10000
      },
      security: {
        enabled: config.security?.enabled ?? true,
        apiKey: config.security?.apiKey || 'default-api-key',
        jwtSecret: config.security?.jwtSecret || 'default-jwt-secret',
        rateLimits: config.security?.rateLimits || {
          windowMs: 15 * 60 * 1000,
          maxRequests: 100
        },
        cors: config.security?.cors || {
          allowedOrigins: ['*'],
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization']
        }
      },
      database: config.database || {},
      models: config.models || {}
    };

    this.port = this.config.server.port;
    this.monitor = new Monitor(this.config.monitoring);
    this.bleuAI = new BleuAI();
    this.quantumEnhancer = new QuantumEnhancer();
    this.securityManager = new SecurityManager(this.config.security);
    
    this.deployedModels = new Map();
    this.deployments = new Map();
    this.app = express();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Model deployer already initialized');
      return;
    }

    try {
      await this.securityManager.initialize();
      this.setupMiddleware();
      this.setupRoutes();
      this.initialized = true;
      this.logger.info('Model deployer initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize model deployer:', error);
      throw new Error('Model deployer initialization failed');
    }
  }

  private setupMiddleware(): void {
    // CORS configuration
    this.app.use(cors({
      origin: this.config.server?.cors?.allowedOrigins || '*',
      methods: this.config.server?.cors?.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: this.config.server?.cors?.allowedHeaders || ['Content-Type', 'Authorization', 'X-API-Key']
    }));

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Security middleware
    if (this.config.security.enabled) {
      const securityMiddleware = this.securityManager.getMiddleware();
      this.app.use(securityMiddleware);
    }

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.logger.info('Incoming request:', {
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      next();
    });

    // Error handling
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      this.logger.error('Server error:', err);
      const sanitizedError = this.securityManager.sanitizeError(err);
      res.status(500).json({ error: sanitizedError.message });
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', uptime: process.uptime() });
    });

    // Model management routes
    this.app.post('/models', this.deployModel.bind(this));
    this.app.get('/models', this.listModels.bind(this));
    this.app.get('/models/:id', this.getModel.bind(this));
    this.app.delete('/models/:id', this.undeployModel.bind(this));

    // Inference routes
    this.app.post('/models/:id/infer', this.infer.bind(this));

    // Monitoring routes
    this.app.get('/models/:id/metrics', this.getMetrics.bind(this));
    this.app.get('/models/:id/status', this.getStatus.bind(this));
  }

  public async start(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Model deployer already initialized');
      return;
    }

    try {
      this.server = this.app.listen(this.port, () => {
        this.logger.info(`Model deployer started on port ${this.port}`);
        this.initialized = true;
      });

      // Initialize monitoring
      await this.initializeMonitoring();

      // Start health checks
      this.startHealthChecks();
    } catch (error) {
      this.logger.error('Failed to start model deployer', { error });
      throw error;
    }
  }

  private async initializeMonitoring(): Promise<void> {
    try {
      // Configure monitoring for each model
      for (const [name, model] of this.deployedModels) {
        await this.monitor.recordMetric({
          name: 'model_deployment_status',
          value: 1,
          labels: {
            model: name,
            type: this.getModelType(model)
          }
        });

        // Set up model-specific metrics
        const metrics = this.getModelMetrics(name);
        metrics.forEach(metric => {
          this.monitor.recordMetric({
            name: `model_${metric}`,
            value: 0,
            labels: { model: name }
          });
        });
      }

      this.logger.info('Monitoring initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize monitoring', { error });
      throw error;
    }
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      for (const [name, deployment] of this.deployments) {
        try {
          const health = await this.checkModelHealth(name);
          this.updateDeploymentStatus(name, health);
        } catch (error) {
          this.logger.error(`Health check failed for model ${name}`, { error });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private async checkModelHealth(name: string): Promise<DeploymentStatus['health']> {
    const model = this.deployedModels.get(name);
    if (!model) {
      throw new Error(`Model ${name} not found`);
    }

    const checks: Record<string, boolean> = {
      endpoint: await this.checkEndpoint(name),
      resources: await this.checkResources(name),
      performance: await this.checkPerformance(name)
    };

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (Object.values(checks).every(check => check)) {
      status = 'healthy';
    } else if (Object.values(checks).some(check => check)) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return { status, checks };
  }

  private async checkEndpoint(name: string): Promise<boolean> {
    try {
      const model = this.deployedModels.get(name);
      if (!model) return false;

      const endpoint = this.getModelEndpoint(model);
      const response = await fetch(endpoint);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkResources(name: string): Promise<boolean> {
    const deployment = this.deployments.get(name);
    if (!deployment) return false;

    const { cpu, memory } = deployment.metrics.resourceUsage;
    const model = this.deployedModels.get(name);
    if (!model) return false;

    return cpu <= this.getModelResources(model).cpu * 0.9 && memory <= this.getModelResources(model).memory * 0.9;
  }

  private async checkPerformance(name: string): Promise<boolean> {
    const deployment = this.deployments.get(name);
    if (!deployment) return false;

    return deployment.metrics.errorRate < 0.01 && deployment.metrics.latency < 1000;
  }

  private updateDeploymentStatus(name: string, health: DeploymentStatus['health']): void {
    const deployment = this.deployments.get(name);
    if (!deployment) return;

    deployment.health = health;
    deployment.lastUpdated = new Date();

    this.deployments.set(name, deployment);
    this.monitor.recordMetric({
      name: 'model_health_status',
      value: health.status === 'healthy' ? 1 : health.status === 'degraded' ? 0.5 : 0,
      labels: { model: name }
    });
  }

  private async deployModel(req: express.Request, res: express.Response): Promise<void> {
    try {
      const modelConfig = req.body as ModelConfig;
      const id = await this.deploy(modelConfig);
      res.json({ id });
    } catch (error) {
      this.logger.error('Failed to deploy model:', error);
      res.status(500).json({ error: 'Failed to deploy model' });
    }
  }

  private async listModels(req: express.Request, res: express.Response): Promise<void> {
    try {
      const models = Array.from(this.deployedModels.entries()).map(([id, config]) => ({
        id,
        ...config
      }));
      res.json(models);
    } catch (error) {
      this.logger.error('Failed to list models:', error);
      res.status(500).json({ error: 'Failed to list models' });
    }
  }

  private async getModel(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const model = this.deployedModels.get(id);
      if (!model) {
        res.status(404).json({ error: 'Model not found' });
        return;
      }
      res.json(model);
    } catch (error) {
      this.logger.error('Failed to get model:', error);
      res.status(500).json({ error: 'Failed to get model' });
    }
  }

  private async undeployModel(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.undeploy(id);
      res.json({ message: 'Model undeployed successfully' });
    } catch (error) {
      this.logger.error('Failed to undeploy model:', error);
      res.status(500).json({ error: 'Failed to undeploy model' });
    }
  }

  private async infer(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body;
      const result = await this.inferModel(id, input);
      res.json(result);
    } catch (error) {
      this.logger.error('Failed to perform inference:', error);
      res.status(500).json({ error: 'Failed to perform inference' });
    }
  }

  private async getMetrics(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const metrics = await this.monitor.getMetrics({ name: id });
      res.json(metrics);
    } catch (error) {
      this.logger.error('Failed to get metrics:', error);
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  }

  private async getStatus(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const status = this.deployments.get(id);
      if (!status) {
        res.status(404).json({ error: 'Deployment status not found' });
        return;
      }
      res.json(status);
    } catch (error) {
      this.logger.error('Failed to get status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }

  public async deploy(modelConfig: ModelConfig): Promise<string> {
    if (!this.initialized) {
      throw new Error('ModelDeployer not initialized');
    }

    try {
      const id = Math.random().toString(36).substring(7);
      this.deployedModels.set(id, modelConfig);
      this.deployments.set(id, { status: 'deploying' });

      // Initialize model
      await this.bleuAI.loadModel(modelConfig);
      await this.quantumEnhancer.enhanceModel(modelConfig);

      // Update deployment status
      this.deployments.set(id, { status: 'ready' });

      this.logger.info(`Model deployed successfully with ID: ${id}`);
      return id;
    } catch (error) {
      this.logger.error('Failed to deploy model:', error);
      throw new Error('Failed to deploy model');
    }
  }

  public async undeploy(id: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('ModelDeployer not initialized');
    }

    try {
      const modelConfig = this.deployedModels.get(id);
      if (!modelConfig) {
        throw new Error('Model not found');
      }

      // Cleanup model resources
      await this.bleuAI.unloadModel(modelConfig);
      await this.quantumEnhancer.removeEnhancement(modelConfig);

      // Remove from tracking
      this.deployedModels.delete(id);
      this.deployments.delete(id);

      this.logger.info(`Model undeployed successfully: ${id}`);
    } catch (error) {
      this.logger.error('Failed to undeploy model:', error);
      throw new Error('Failed to undeploy model');
    }
  }

  public async inferModel(id: string, input: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('ModelDeployer not initialized');
    }

    try {
      const modelConfig = this.deployedModels.get(id);
      if (!modelConfig) {
        throw new Error('Model not found');
      }

      const status = this.deployments.get(id);
      if (!status || status.status !== 'ready') {
        throw new Error('Model not ready for inference');
      }

      // Perform inference
      const result = await this.bleuAI.infer(modelConfig, input);
      
      // Record metrics
      await this.monitor.recordMetric({
        name: id,
        value: result.latency,
        timestamp: Date.now(),
        labels: { type: 'inference' }
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to perform inference:', error);
      throw new Error('Failed to perform inference');
    }
  }

  public async stop(): Promise<void> {
    if (!this.initialized) {
      this.logger.warn('Model deployer not initialized');
      return;
    }

    try {
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server?.close(() => resolve());
        });
        this.server = null;
      }
      this.initialized = false;
      this.logger.info('Model deployer stopped');
    } catch (error) {
      this.logger.error('Failed to stop model deployer', { error });
      throw error;
    }
  }
}