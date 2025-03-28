//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import { Egg } from '../types/egg';
import { EventEmitter } from 'events';
import { createHash, randomBytes } from 'crypto';
import { promisify } from 'util';

const randomBytesAsync = promisify(randomBytes);

interface SecurityConfig {
  saltRounds: number;
  tokenExpiration: number; // in milliseconds
  maxLoginAttempts: number;
  lockoutDuration: number; // in milliseconds
  requireTwoFactor: boolean;
  allowedOrigins: string[];
  rateLimits: {
    login: number;
    eggGeneration: number;
    trading: number;
  };
}

interface UserSession {
  userId: string;
  token: string;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}

interface SecurityEvent {
  type: 'login' | 'logout' | 'failed_login' | 'suspicious_activity' | 'token_expired';
  userId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details: any;
}

interface RateLimit {
  count: number;
  resetTime: Date;
}

export class EggSecurityService extends EventEmitter {
  private sessions: Map<string, UserSession>;
  private loginAttempts: Map<string, number>;
  private rateLimits: Map<string, RateLimit>;
  private securityEvents: SecurityEvent[];
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    super();
    this.sessions = new Map();
    this.loginAttempts = new Map();
    this.rateLimits = new Map();
    this.securityEvents = [];
    this.config = config;
  }

  public async generateToken(userId: string, ipAddress: string, userAgent: string): Promise<string> {
    const token = await this.createSecureToken();
    const session: UserSession = {
      userId,
      token,
      expiresAt: new Date(Date.now() + this.config.tokenExpiration),
      lastActivity: new Date(),
      ipAddress,
      userAgent
    };

    this.sessions.set(token, session);
    this.emit('sessionCreated', { session });
    return token;
  }

  public async validateToken(token: string, ipAddress: string, userAgent: string): Promise<boolean> {
    const session = this.sessions.get(token);
    if (!session) return false;

    // Check expiration
    if (session.expiresAt < new Date()) {
      this.invalidateSession(token);
      return false;
    }

    // Check IP and user agent
    if (session.ipAddress !== ipAddress || session.userAgent !== userAgent) {
      this.logSecurityEvent('suspicious_activity', session.userId, ipAddress, userAgent, {
        reason: 'IP or user agent mismatch'
      });
      return false;
    }

    // Update last activity
    session.lastActivity = new Date();
    return true;
  }

  public async invalidateSession(token: string): Promise<void> {
    const session = this.sessions.get(token);
    if (session) {
      this.sessions.delete(token);
      this.emit('sessionInvalidated', { session });
    }
  }

  public async validateLoginAttempt(
    userId: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Check rate limit
      if (!this.checkRateLimit('login', ipAddress)) {
        return {
          success: false,
          error: 'Too many login attempts. Please try again later.'
        };
      }

      // Check if user is locked out
      if (this.isUserLocked(userId)) {
        return {
          success: false,
          error: 'Account is temporarily locked. Please try again later.'
        };
      }

      // Validate credentials (implement your authentication logic here)
      const isValid = await this.validateCredentials(userId, password);
      if (!isValid) {
        this.handleFailedLogin(userId, ipAddress, userAgent);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Reset login attempts on successful login
      this.loginAttempts.delete(userId);

      // Generate new token
      const token = await this.generateToken(userId, ipAddress, userAgent);
      this.logSecurityEvent('login', userId, ipAddress, userAgent);

      return { success: true, token };
    } catch (error) {
      this.logSecurityEvent('failed_login', userId, ipAddress, userAgent, { error });
      return {
        success: false,
        error: 'An error occurred during login'
      };
    }
  }

  public async validateEggOperation(
    userId: string,
    operation: 'generate' | 'evolve' | 'trade',
    ipAddress: string
  ): Promise<boolean> {
    // Check rate limit
    if (!this.checkRateLimit(operation, ipAddress)) {
      return false;
    }

    // Validate user session
    const session = this.getActiveSession(userId);
    if (!session) {
      return false;
    }

    // Additional security checks based on operation
    switch (operation) {
      case 'generate':
        return this.validateEggGeneration(userId);
      case 'evolve':
        return this.validateEggEvolution(userId);
      case 'trade':
        return this.validateEggTrading(userId);
      default:
        return false;
    }
  }

  public async validateEggOwnership(userId: string, eggId: string): Promise<boolean> {
    // Implement egg ownership validation logic
    return true;
  }

  public async validateEggTransfer(
    fromUserId: string,
    toUserId: string,
    eggId: string
  ): Promise<boolean> {
    // Validate ownership
    if (!await this.validateEggOwnership(fromUserId, eggId)) {
      return false;
    }

    // Validate transfer limits and restrictions
    if (!this.checkTransferLimits(fromUserId)) {
      return false;
    }

    return true;
  }

  private async createSecureToken(): Promise<string> {
    const buffer = await randomBytesAsync(32);
    return buffer.toString('hex');
  }

  private async validateCredentials(userId: string, password: string): Promise<boolean> {
    // Implement your credential validation logic here
    return true;
  }

  private handleFailedLogin(userId: string, ipAddress: string, userAgent: string): void {
    const attempts = (this.loginAttempts.get(userId) || 0) + 1;
    this.loginAttempts.set(userId, attempts);

    if (attempts >= this.config.maxLoginAttempts) {
      this.lockUser(userId);
    }

    this.logSecurityEvent('failed_login', userId, ipAddress, userAgent, { attempts });
  }

  private lockUser(userId: string): void {
    setTimeout(() => {
      this.loginAttempts.delete(userId);
    }, this.config.lockoutDuration);
  }

  private isUserLocked(userId: string): boolean {
    const attempts = this.loginAttempts.get(userId) || 0;
    return attempts >= this.config.maxLoginAttempts;
  }

  private checkRateLimit(operation: string, ipAddress: string): boolean {
    const key = `${operation}_${ipAddress}`;
    const limit = this.rateLimits.get(key);

    if (!limit) {
      this.rateLimits.set(key, {
        count: 1,
        resetTime: new Date(Date.now() + 60 * 1000) // 1 minute
      });
      return true;
    }

    if (limit.resetTime < new Date()) {
      this.rateLimits.set(key, {
        count: 1,
        resetTime: new Date(Date.now() + 60 * 1000)
      });
      return true;
    }

    if (limit.count >= this.config.rateLimits[operation as keyof typeof this.config.rateLimits]) {
      return false;
    }

    limit.count++;
    return true;
  }

  private getActiveSession(userId: string): UserSession | undefined {
    return Array.from(this.sessions.values())
      .find(session => session.userId === userId && session.expiresAt > new Date());
  }

  private validateEggGeneration(userId: string): boolean {
    // Implement egg generation validation logic
    return true;
  }

  private validateEggEvolution(userId: string): boolean {
    // Implement egg evolution validation logic
    return true;
  }

  private validateEggTrading(userId: string): boolean {
    // Implement egg trading validation logic
    return true;
  }

  private checkTransferLimits(userId: string): boolean {
    // Implement transfer limit validation logic
    return true;
  }

  private logSecurityEvent(
    type: SecurityEvent['type'],
    userId: string,
    ipAddress: string,
    userAgent: string,
    details: any = {}
  ): void {
    const event: SecurityEvent = {
      type,
      userId,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      details
    };

    this.securityEvents.push(event);
    this.emit('securityEvent', { event });

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents.shift();
    }
  }

  public async getSecurityEvents(
    userId?: string,
    type?: SecurityEvent['type']
  ): Promise<SecurityEvent[]> {
    return this.securityEvents.filter(event => {
      if (userId && event.userId !== userId) return false;
      if (type && event.type !== type) return false;
      return true;
    });
  }

  public async getActiveSessions(userId: string): Promise<UserSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && session.expiresAt > new Date());
  }

  public async invalidateAllUserSessions(userId: string): Promise<void> {
    const sessions = await this.getActiveSessions(userId);
    for (const session of sessions) {
      await this.invalidateSession(session.token);
    }
  }

  public async validateOrigin(origin: string): Promise<boolean> {
    return this.config.allowedOrigins.includes(origin);
  }

  public async hashPassword(password: string): Promise<string> {
    const salt = await randomBytesAsync(16);
    const hash = createHash('sha256');
    hash.update(salt);
    hash.update(password);
    return `${salt.toString('hex')}:${hash.digest('hex')}`;
  }

  public async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const [saltHex, hashHex] = hashedPassword.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const hash = createHash('sha256');
    hash.update(salt);
    hash.update(password);
    return hash.digest('hex') === hashHex;
  }
} 