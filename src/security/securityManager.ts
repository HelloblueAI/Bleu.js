import { Logger } from '../utils/logger';
import { SecurityError, ValidationError } from '../utils/errors';
import { Config } from '../types';
import { Storage } from '../utils/storage';
import { rateLimit } from 'express-rate-limit';
import { CORSManager } from './corsManager';
import { ProcessingError } from '../utils/errors';
import cors from 'cors';
import helmet from 'helmet';
import { 
  SecurityScore, 
  SecurityReport, 
  Vulnerability, 
  SecurityEventType,
  SecurityConfig
} from '../types/security';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { QuantumResistantCrypto } from './quantumResistantCrypto.js';
import { AccessController } from './accessController.js';
import { SecurityAuditLogger } from './securityAuditLogger.js';
import { VulnerabilityScanner } from './vulnerabilityScanner.js';
import express from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs-node';
import { QuantumProcessor } from '../quantum/quantumProcessor';
import { SecurityValidator } from './validator';
import { SecurityMonitor } from './monitor';
import { SecurityAuditor } from './auditor';
import { SecurityPolicy } from './policy';
import { ThreatDetector } from './threatDetector';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { JWTManager } from './jwtManager';

const logger = new Logger('SecurityManager');

// Advanced security constants
const SECURITY_CONSTANTS = {
  DEFAULT_KEY_SIZE: 32,
  DEFAULT_IV_SIZE: 16,
  DEFAULT_ALGORITHM: 'aes-256-gcm',
  DEFAULT_ROLES: ['admin', 'user', 'guest'],
  DEFAULT_RETENTION_DAYS: 30,
  RATE_LIMIT_POINTS: 100,
  RATE_LIMIT_DURATION: 60,
  MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_LOG_FILES: 5,
  KEY_ROTATION_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  PASSWORD_COMPLEXITY: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  }
} as const;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface Request {
  headers: {
    'x-api-key'?: string;
    authorization?: string;
    origin?: string;
  };
  body?: any;
  method?: string;
  origin?: string;
}

export class SecurityManager extends EventEmitter {
  private readonly logger: Logger;
  private readonly config: SecurityConfig;
  private readonly threatDetector: ThreatDetector;
  private readonly key: Buffer;
  private readonly iv: Buffer;
  private readonly randomBytes = promisify(randomBytes);
  private readonly failedAttempts: Map<string, { count: number; lastAttempt: number; riskScore: number }> = new Map();
  private readonly activeSessions: Map<string, { userId: string; expiresAt: number; riskScore: number }> = new Map();
  private readonly keyRotationTimer: NodeJS.Timeout | null = null;
  private readonly encryptionKey: Buffer;
  private readonly baseDir: string;
  private readonly threatModel: tf.LayersModel | null = null;
  private readonly securityMetrics: Map<string, number[]> = new Map();
  private readonly adaptiveSecurityLevel: number = 1.0;
  private readonly quantumCrypto: QuantumResistantCrypto;
  private readonly accessController: AccessController;
  private readonly auditLogger: SecurityAuditLogger;
  private readonly vulnerabilityScanner: VulnerabilityScanner;
  private readonly rateLimiter: ReturnType<typeof rateLimit>;
  private readonly quantum: QuantumProcessor;
  private readonly validator: SecurityValidator;
  private readonly monitor: SecurityMonitor;
  private readonly auditor: SecurityAuditor;
  private readonly policy: SecurityPolicy;
  private readonly jwtManager: JWTManager;
  private readonly allowedOrigins: Set<string>;
  private readonly storage: Storage;
  private readonly corsManager: CORSManager;
  private readonly rateLimits: Map<string, { count: number; timestamp: number }> = new Map();
  private readonly app: express.Application;

  constructor(config: SecurityConfig, storage: Storage) {
    super();
    if (!config || !logger) {
      throw new SecurityError('Invalid configuration or logger');
    }
    if (!config.jwtSecret || !config.apiKeys || !config.allowedOrigins) {
      throw new SecurityError('Missing required security configuration');
    }
    this.logger = logger;
    this.config = config;
    this.storage = storage;
    this.corsManager = new CORSManager(config);
    this.rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    this.allowedOrigins = new Set(this.config.allowedOrigins || ['http://localhost:3000']);
    this.encryptionKey = randomBytes(32);
    this.baseDir = process.cwd();
    this.quantumCrypto = new QuantumResistantCrypto();
    this.vulnerabilityScanner = new VulnerabilityScanner(this.config);
    this.quantum = new QuantumProcessor();
    this.validator = new SecurityValidator();
    this.monitor = new SecurityMonitor();
    this.auditor = new SecurityAuditor();
    this.policy = new SecurityPolicy();
    this.jwtManager = new JWTManager(this.config.jwtSecret);
    this.app = express();
    this.setupSecurity();
  }

  private setupSecurity(): void {
    // Apply security middleware
    this.app.use(helmet());
    this.app.use(this.rateLimiter.middleware());
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('SecurityManager already initialized');
      return;
    }

    try {
      await Promise.all([
        this.threatDetector.initialize(),
        this.accessController.initialize(),
        this.auditLogger.initialize(),
        this.rateLimiter.initialize(),
        this.initializeComponents(),
        this.loadThreatModel(),
        this.setupKeyRotation(),
        this.startAdaptiveSecurityLoop(),
        this.quantum.initialize(),
        this.validator.initialize(),
        this.monitor.initialize(),
        this.auditor.initialize(),
        this.policy.initialize(),
        this.corsManager.initialize()
      ]);

      this.initialized = true;
      this.logger.info('SecurityManager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize SecurityManager:', error);
      throw new ProcessingError('Failed to initialize security components');
    }
  }

  private async initializeComponents(): Promise<void> {
    try {
      this.key = await this.randomBytes(this.config.security.encryption.keySize);
      this.iv = await this.randomBytes(this.config.security.encryption.ivSize);
      
      await Promise.all([
        this.accessController.initialize(),
        this.auditLogger.initialize(),
        this.vulnerabilityScanner.initialize()
      ]);
    } catch (error) {
      this.logger.error('Failed to initialize security components:', { error });
      throw new ProcessingError('Failed to initialize security components');
    }
  }

  private async loadThreatModel(): Promise<void> {
    try {
      const modelData = await fs.readFile(join(this.baseDir, 'models', 'threat_model.json'), 'utf-8');
      this.threatModel = await tf.loadLayersModel(tf.io.browserFiles([modelData]));
    } catch (error) {
      this.logger.warn('No existing threat model found, creating new one');
      this.threatModel = this.createThreatModel();
    }
  }

  private createThreatModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [10] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  private startAdaptiveSecurityLoop(): void {
    setInterval(async () => {
      await this.updateAdaptiveSecurityLevel();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async updateAdaptiveSecurityLevel(): Promise<void> {
    try {
      const metrics = await this.calculateSecurityMetrics();
      const riskScore = await this.predictRiskScore(metrics);
      
      // Adjust security level based on risk score
      this.adaptiveSecurityLevel = Math.max(0.5, Math.min(1.5, 1.0 + (riskScore - 0.5)));
      
      // Update rate limiter based on security level
      this.rateLimiter = rateLimit({
        windowMs: Math.floor(this.config.rateLimits?.windowMs * this.adaptiveSecurityLevel),
        max: this.config.rateLimits?.maxRequests
      });

      this.logger.info('Updated adaptive security level', {
        level: this.adaptiveSecurityLevel,
        riskScore,
        metrics
      });
    } catch (error) {
      this.logger.error('Failed to update adaptive security level:', error);
    }
  }

  private async calculateSecurityMetrics(): Promise<number[]> {
    const metrics: number[] = [];
    
    // Calculate failed attempts ratio
    const failedAttemptsRatio = this.failedAttempts.size / this.activeSessions.size;
    metrics.push(failedAttemptsRatio);

    // Calculate average risk score of active sessions
    const avgSessionRisk = Array.from(this.activeSessions.values())
      .reduce((sum, session) => sum + session.riskScore, 0) / this.activeSessions.size;
    metrics.push(avgSessionRisk);

    // Add more security metrics here...

    return metrics;
  }

  private async predictRiskScore(metrics: number[]): Promise<number> {
    if (!this.threatModel) return 0.5;

    const input = tf.tensor2d([metrics]);
    const prediction = this.threatModel.predict(input) as tf.Tensor;
    const riskScore = await prediction.data();
    
    input.dispose();
    prediction.dispose();
    
    return riskScore[0];
  }

  private async encrypt(data: string): Promise<string> {
    const buffer = Buffer.from(data, 'utf8');
    const cipher = crypto.createCipheriv(
      this.config.security.encryption.algorithm,
      this.key,
      this.iv
    );

    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final()
    ]);

    const tag = cipher.getAuthTag();
    const result = Buffer.concat([this.iv, tag, encrypted]);

    return result.toString('base64');
  }

  private async decrypt(encryptedData: string): Promise<string> {
    const buffer = Buffer.from(encryptedData, 'base64');
    const iv = buffer.subarray(0, this.config.security.encryption.ivSize);
    const tag = buffer.subarray(
      this.config.security.encryption.ivSize,
      this.config.security.encryption.ivSize + 16
    );
    const encrypted = buffer.subarray(this.config.security.encryption.ivSize + 16);

    const decipher = crypto.createDecipheriv(
      this.config.security.encryption.algorithm,
      this.key,
      iv
    );

    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  }

  async detectThreats(data: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      const threats = await this.threatDetector.analyze(data);
      const hasThreats = threats.length > 0;
      
      if (hasThreats) {
        this.logger.security('Threats detected', { threats });
        this.emit(SecurityEventType.THREAT_DETECTED, { threats });
      }

      this.logger.performance('threat_detection', Date.now() - startTime);
      return hasThreats;
    } catch (error) {
      this.logger.error('Threat detection failed:', { error });
      throw error;
    }
  }

  async checkAccess(userId: string, resource: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      // Check if user is locked out
      if (this.isUserLocked(userId)) {
        this.logger.security('Access denied - user locked out', { userId });
        return false;
      }

      // Check session validity and risk score
      const session = this.activeSessions.get(userId);
      if (!session || !this.isSessionValid(userId)) {
        this.logger.security('Access denied - invalid session', { userId });
        return false;
      }

      // Apply adaptive security based on risk score
      if (session.riskScore > 0.8) {
        // Require additional authentication for high-risk sessions
        if (!await this.performAdditionalAuth(userId)) {
          return false;
        }
      }

      const userRole = await this.getUserRole(userId);
      const permissions = this.config.security.authorization.permissions[userRole] || [];
      
      const hasAccess = permissions.includes(resource);
      
      this.logger.audit('access_check', userId, {
        resource,
        role: userRole,
        granted: hasAccess,
        riskScore: session.riskScore
      });

      this.logger.performance('access_check', Date.now() - startTime);
      return hasAccess;
    } catch (error) {
      this.logger.error('Access check failed:', { error, userId, resource });
      throw error;
    }
  }

  private isUserLocked(userId: string): boolean {
    const attempts = this.failedAttempts.get(userId);
    if (!attempts) return false;

    if (attempts.count >= SECURITY_CONSTANTS.MAX_FAILED_ATTEMPTS) {
      const lockoutExpiry = attempts.lastAttempt + SECURITY_CONSTANTS.LOCKOUT_DURATION;
      if (Date.now() < lockoutExpiry) {
        return true;
      }
      // Reset after lockout period
      this.failedAttempts.delete(userId);
    }
    return false;
  }

  private isSessionValid(userId: string): boolean {
    const session = this.activeSessions.get(userId);
    if (!session) return false;

    if (Date.now() > session.expiresAt) {
      this.activeSessions.delete(userId);
      return false;
    }

    return true;
  }

  async logSecurityEvent(event: Record<string, any>): Promise<void> {
    if (!this.config.security.audit.enabled) return;

    try {
      const logEntry = {
        ...event,
        timestamp: new Date(),
        type: 'security_event'
      };
      
      this.logger.security('Security event logged', logEntry);
      this.emit(SecurityEventType.THREAT_DETECTED, logEntry);
    } catch (error) {
      this.logger.error('Failed to log security event:', { error, event });
      throw error;
    }
  }

  async rotateKeys(): Promise<void> {
    const startTime = Date.now();
    try {
      const newKeys = await this.quantumCrypto.generateKeys();
      
      this.key = newKeys.key;
      this.iv = newKeys.iv;
      
      this.logger.security('Keys rotated', { duration: Date.now() - startTime });
      this.emit(SecurityEventType.KEY_ROTATION, { timestamp: new Date() });
    } catch (error) {
      this.logger.error('Key rotation failed:', { error });
      throw error;
    }
  }

  async updatePermissions(role: string, permissions: string[]): Promise<void> {
    try {
      if (!this.config.security.authorization.roles.includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }

      this.config.security.authorization.permissions[role] = permissions;
      this.logger.audit('permissions_updated', 'system', { role, permissions });
      this.emit(SecurityEventType.PERMISSION_CHANGE, { role, permissions });
    } catch (error) {
      this.logger.error('Failed to update permissions:', { error, role, permissions });
      throw error;
    }
  }

  private async getUserRole(userId: string): Promise<string> {
    // In a real implementation, this would fetch the user's role from a database
    return this.config.security.authorization.defaultRole;
  }

  async cleanupAuditLogs(): Promise<void> {
    if (!this.config.security.audit.enabled) return;

    try {
      const retentionMs = this.config.security.audit.retentionDays * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(Date.now() - retentionMs);

      this.logger.audit('audit_logs_cleanup', 'system', { cutoffDate });
    } catch (error) {
      this.logger.error('Failed to cleanup audit logs:', { error });
      throw error;
    }
  }

  async scanVulnerabilities(): Promise<SecurityReport> {
    const startTime = Date.now();
    try {
      const vulnerabilities = await this.vulnerabilityScanner.scan();
      const score = this.calculateSecurityScore(vulnerabilities);
      
      const report = {
        timestamp: new Date(),
        score,
        vulnerabilities,
        recommendations: this.generateRecommendations(vulnerabilities)
      };

      if (vulnerabilities.length > 0) {
        this.emit(SecurityEventType.VULNERABILITY_FOUND, report);
      }

      this.logger.performance('vulnerability_scan', Date.now() - startTime);
      return report;
    } catch (error) {
      this.logger.error('Vulnerability scan failed:', { error });
      throw error;
    }
  }

  private calculateSecurityScore(vulnerabilities: Vulnerability[]): SecurityScore {
    const weights = {
      critical: 0.4,
      high: 0.3,
      medium: 0.2,
      low: 0.1
    };

    const scores = {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length
    };

    return {
      overall: 100 - (
        scores.critical * weights.critical +
        scores.high * weights.high +
        scores.medium * weights.medium +
        scores.low * weights.low
      ) * 10,
      encryption: 100,
      authentication: 100,
      authorization: 100,
      compliance: 100
    };
  }

  private generateRecommendations(vulnerabilities: Vulnerability[]): string[] {
    return vulnerabilities.map(v => 
      `Fix ${v.severity} severity vulnerability: ${v.description}`
    );
  }

  async dispose(): Promise<void> {
    try {
      if (this.keyRotationTimer) {
        clearInterval(this.keyRotationTimer);
      }

      // Clear sensitive data
      this.key = Buffer.alloc(0);
      this.iv = Buffer.alloc(0);
      
      await Promise.all([
        this.threatDetector.dispose(),
        this.quantumCrypto.dispose(),
        this.accessController.dispose(),
        this.auditLogger.dispose(),
        this.vulnerabilityScanner.dispose(),
        this.quantum.dispose(),
        this.validator.dispose(),
        this.monitor.dispose(),
        this.auditor.dispose(),
        this.policy.dispose(),
        this.corsManager.dispose()
      ]);
      
      this.logger.info('Security manager disposed successfully');
    } catch (error) {
      this.logger.error('Failed to dispose security manager:', { error });
      throw error;
    }
  }

  getMiddleware(): express.RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validationResult = await this.validateRequest(req);
        if (!validationResult.isValid) {
          return res.status(401).json({ error: validationResult.error });
        }
        next();
      } catch (error) {
        this.logger.error('Security middleware error:', error);
        return res.status(500).json({ error: 'Internal security error' });
      }
    };
  }

  public async validateRequest(request: Request): Promise<ValidationResult> {
    this.logger.debug('Validating request');

    // Check API key
    const apiKey = request.headers['x-api-key'];
    if (!apiKey) {
      this.logger.error('No API key provided');
      return { isValid: false, error: 'Authentication required' };
    }

    if (!this.config.apiKeys.includes(apiKey)) {
      this.logger.error('Invalid API key');
      return { isValid: false, error: 'Invalid API key' };
    }

    // Check JWT token if present
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        await this.validateToken(token);
      } catch (error) {
        this.logger.error('Invalid JWT token');
        return { isValid: false, error: 'Invalid token' };
      }
    }

    // Check rate limit
    if (!this.checkRateLimit(apiKey)) {
      this.logger.error('Rate limit exceeded');
      return { isValid: false, error: 'Rate limit exceeded' };
    }

    // Validate request body if present
    if (request.body && !this.validateRequestBody(request.body)) {
      this.logger.error('Invalid request body');
      return { isValid: false, error: 'Invalid request body' };
    }

    this.logger.info('Request validated successfully');
    return { isValid: true };
  }

  public async validateToken(token: string): Promise<any> {
    this.logger.debug('Validating JWT token');
    try {
      return jwt.verify(token, this.config.jwtSecret);
    } catch (error) {
      this.logger.error('Failed to validate JWT token:', error);
      throw new SecurityError('Invalid token');
    }
  }

  public async validateCORS(request: Request): Promise<ValidationResult> {
    this.logger.debug('Validating CORS');
    const origin = request.origin || request.headers.origin;

    if (!origin || !this.config.allowedOrigins.includes(origin)) {
      this.logger.error('Invalid origin:', origin);
      return { isValid: false, error: 'Invalid origin' };
    }

    this.logger.info('CORS validation successful');
    return { isValid: true };
  }

  public async resetRateLimit(clientId: string): Promise<void> {
    this.logger.info('Rate limit reset for client:', clientId);
    this.rateLimits.delete(clientId);
  }

  public sanitizeError(error: Error): { message: string; stack?: string } {
    this.logger.debug('Sanitizing error message');
    if (!error) {
      this.logger.error('Error object is required');
      throw new SecurityError('Error object is required');
    }

    return {
      message: 'An unexpected error occurred'
    };
  }

  private validateRequestBody(body: any): boolean {
    return body && typeof body === 'object' && !Array.isArray(body);
  }

  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(clientId);

    if (!limit) {
      this.rateLimits.set(clientId, { count: 1, timestamp: now });
      return true;
    }

    if (now - limit.timestamp > this.config.rateLimits.windowMs) {
      this.rateLimits.set(clientId, { count: 1, timestamp: now });
      return true;
    }

    if (limit.count >= this.config.rateLimits.maxRequests) {
      return false;
    }

    limit.count++;
    return true;
  }

  public async cleanup(): Promise<void> {
    try {
      this.logger.info('Cleaning up SecurityManager');
      this.rateLimits.clear();
      this.logger.info('SecurityManager cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup SecurityManager:', error);
      throw new SecurityError('Failed to cleanup SecurityManager');
    }
  }

  setupCORS(app: express.Application): void {
    try {
      // Configure CORS middleware
      const corsOptions = {
        origin: Array.from(this.allowedOrigins),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-ID'],
        credentials: true,
        maxAge: 86400 // 24 hours
      };
      
      app.use(cors(corsOptions));
      this.logger.info('CORS middleware setup successfully');
    } catch (error) {
      this.logger.error('Failed to setup CORS middleware:', error);
      throw error;
    }
  }

  setupRateLimiting(app: express.Application): void {
    try {
      // Configure rate limiting middleware
      const limiter = rateLimit({
        windowMs: this.config.rateLimits.windowMs || 15 * 60 * 1000, // 15 minutes
        max: this.config.rateLimits.maxRequests || 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later'
      });
      
      app.use(limiter);
      this.logger.info('Rate limiting middleware setup successfully');
    } catch (error) {
      this.logger.error('Failed to setup rate limiting middleware:', error);
      throw error;
    }
  }

  setupJWT(app: express.Application): void {
    try {
      // Configure JWT middleware
      app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
          try {
            const decoded = this.validateToken(token);
            (req as any).user = decoded;
          } catch (error) {
            res.status(401).send('Invalid token');
            return;
          }
        }
        next();
      });
      
      this.logger.info('JWT middleware setup successfully');
    } catch (error) {
      this.logger.error('Failed to setup JWT middleware:', error);
      throw error;
    }
  }
} 