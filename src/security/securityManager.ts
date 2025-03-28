import { createLogger } from '../utils/logger';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { 
  SecurityConfig, 
  SecurityScore, 
  SecurityReport, 
  Vulnerability, 
  ScanResult,
  SecurityEventType 
} from '../types/security';
import { QuantumResistantCrypto } from './quantumResistantCrypto.js';
import { AdvancedThreatDetector } from './threatDetector.js';
import { AccessController } from './accessController.js';
import { SecurityAuditLogger } from './securityAuditLogger.js';
import { VulnerabilityScanner } from './vulnerabilityScanner.js';
import { ThreatDetector } from './threatDetector.js';
import express from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logger = createLogger('SecurityManager');

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

export class SecurityManager extends EventEmitter {
  private config: SecurityConfig;
  private key: Buffer;
  private iv: Buffer;
  private logger = createLogger('SecurityManager');
  private threatDetector: ThreatDetector;
  private quantumCrypto: QuantumResistantCrypto;
  private accessController: AccessController;
  private auditLogger: SecurityAuditLogger;
  private vulnerabilityScanner: VulnerabilityScanner;
  private rateLimiter: RateLimiterMemory;
  private readonly randomBytes = promisify(crypto.randomBytes);
  private failedAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private activeSessions: Map<string, { userId: string; expiresAt: number }> = new Map();
  private keyRotationTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<SecurityConfig> = {}) {
    super();
    this.config = {
      encryption: {
        algorithm: SECURITY_CONSTANTS.DEFAULT_ALGORITHM,
        keySize: SECURITY_CONSTANTS.DEFAULT_KEY_SIZE,
        ivSize: SECURITY_CONSTANTS.DEFAULT_IV_SIZE,
        keyRotationInterval: SECURITY_CONSTANTS.KEY_ROTATION_INTERVAL,
        ...config.encryption
      },
      authorization: {
        roles: SECURITY_CONSTANTS.DEFAULT_ROLES,
        defaultRole: 'user',
        permissions: {},
        sessionTimeout: SECURITY_CONSTANTS.SESSION_TIMEOUT,
        ...config.authorization
      },
      audit: {
        enabled: true,
        retentionDays: SECURITY_CONSTANTS.DEFAULT_RETENTION_DAYS,
        logPath: 'logs/security',
        ...config.audit
      },
      rateLimit: {
        points: SECURITY_CONSTANTS.RATE_LIMIT_POINTS,
        duration: SECURITY_CONSTANTS.RATE_LIMIT_DURATION,
        ...config.rateLimit
      },
      passwordPolicy: {
        ...SECURITY_CONSTANTS.PASSWORD_COMPLEXITY,
        ...config.passwordPolicy
      },
      enabled: config.enabled ?? true,
      encryptionKey: config.encryptionKey || 'default-key'
    };

    this.rateLimiter = new RateLimiterMemory({
      points: this.config.rateLimit.points,
      duration: this.config.rateLimit.duration
    });

    this.initializeComponents();
  }

  private async initializeComponents(): Promise<void> {
    try {
      this.key = await this.randomBytes(this.config.encryption.keySize);
      this.iv = await this.randomBytes(this.config.encryption.ivSize);
      
      this.threatDetector = new ThreatDetector();
      this.quantumCrypto = new QuantumResistantCrypto();
      this.accessController = new AccessController(this.config.authorization);
      this.auditLogger = new SecurityAuditLogger(this.config.audit);
      this.vulnerabilityScanner = new VulnerabilityScanner(this.config);

      await this.initialize();
      this.setupKeyRotation();
    } catch (error) {
      this.logger.error('Failed to initialize security components:', { error });
      throw new Error('Security initialization failed');
    }
  }

  private setupKeyRotation(): void {
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
    }

    this.keyRotationTimer = setInterval(async () => {
      try {
        await this.rotateKeys();
      } catch (error) {
        this.logger.error('Scheduled key rotation failed:', { error });
      }
    }, this.config.encryption.keyRotationInterval);
  }

  async initialize(): Promise<void> {
    const startTime = Date.now();
    try {
      // Validate encryption algorithm
      if (!crypto.getCiphers().includes(this.config.encryption.algorithm)) {
        throw new Error(`Unsupported encryption algorithm: ${this.config.encryption.algorithm}`);
      }

      await Promise.all([
        this.accessController.initialize(),
        this.auditLogger.initialize(),
        this.vulnerabilityScanner.initialize()
      ]);

      this.logger.info('Security manager initialized successfully', {
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.logger.error('Failed to initialize security manager:', { error });
      throw error;
    }
  }

  async encrypt(data: string): Promise<string> {
    const startTime = Date.now();
    try {
      const cipher = crypto.createCipheriv(
        this.config.encryption.algorithm,
        this.key,
        this.iv
      );

      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      const authTag = cipher.getAuthTag();

      const result = Buffer.concat([
        this.iv,
        Buffer.from(encrypted, 'base64'),
        authTag
      ]).toString('base64');

      this.logger.performance('encrypt', Date.now() - startTime);
      return result;
    } catch (error) {
      this.logger.error('Encryption failed:', { error });
      throw new Error('Encryption failed');
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    const startTime = Date.now();
    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      const iv = buffer.slice(0, this.config.encryption.ivSize);
      const authTag = buffer.slice(-this.config.encryption.ivSize);
      const data = buffer.slice(this.config.encryption.ivSize, -this.config.encryption.ivSize);

      const decipher = crypto.createDecipheriv(
        this.config.encryption.algorithm,
        this.key,
        iv
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(data.toString('base64'), 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      this.logger.performance('decrypt', Date.now() - startTime);
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed:', { error });
      throw new Error('Decryption failed');
    }
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

      // Check session validity
      if (!this.isSessionValid(userId)) {
        this.logger.security('Access denied - invalid session', { userId });
        return false;
      }

      const userRole = await this.getUserRole(userId);
      const permissions = this.config.authorization.permissions[userRole] || [];
      
      const hasAccess = permissions.includes(resource);
      
      this.logger.audit('access_check', userId, {
        resource,
        role: userRole,
        granted: hasAccess
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
    if (!this.config.audit.enabled) return;

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
      if (!this.config.authorization.roles.includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }

      this.config.authorization.permissions[role] = permissions;
      this.logger.audit('permissions_updated', 'system', { role, permissions });
      this.emit(SecurityEventType.PERMISSION_CHANGE, { role, permissions });
    } catch (error) {
      this.logger.error('Failed to update permissions:', { error, role, permissions });
      throw error;
    }
  }

  private async getUserRole(userId: string): Promise<string> {
    // In a real implementation, this would fetch the user's role from a database
    return this.config.authorization.defaultRole;
  }

  async cleanupAuditLogs(): Promise<void> {
    if (!this.config.audit.enabled) return;

    try {
      const retentionMs = this.config.audit.retentionDays * 24 * 60 * 60 * 1000;
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
        this.vulnerabilityScanner.dispose()
      ]);
      
      this.logger.info('Security manager disposed successfully');
    } catch (error) {
      this.logger.error('Failed to dispose security manager:', { error });
      throw error;
    }
  }

  getMiddleware(): express.RequestHandler {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const startTime = Date.now();
      try {
        // Rate limiting
        await this.rateLimiter.consume(req.ip);

        // Add security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // Add request ID for tracking
        const requestId = crypto.randomBytes(16).toString('hex');
        req.headers['x-request-id'] = requestId;
        res.setHeader('X-Request-ID', requestId);

        this.logger.performance('security_middleware', Date.now() - startTime, {
          requestId,
          ip: req.ip,
          path: req.path
        });

        next();
      } catch (error) {
        if (error.name === 'RateLimitExceeded') {
          this.logger.security('Rate limit exceeded', { ip: req.ip });
          this.emit(SecurityEventType.RATE_LIMIT_EXCEEDED, { ip: req.ip });
          res.status(429).json({ error: 'Too many requests' });
        } else {
          this.logger.error('Security middleware error:', { error, requestId: req.headers['x-request-id'] });
          next(error);
        }
      }
    };
  }

  getConfig(): SecurityConfig {
    return this.config;
  }
} 