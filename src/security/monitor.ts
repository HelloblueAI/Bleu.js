import { SecurityError } from '../errors/securityError';

export interface SecurityMonitorConfig {
  maxFailedAttempts?: number;
  lockoutDuration?: number;
  monitoringInterval?: number;
  alertThreshold?: number;
}

export class SecurityMonitor {
  private config: SecurityMonitorConfig;
  private failedAttempts: Map<string, number>;
  private lockoutTimes: Map<string, number>;
  private alerts: any[];

  constructor(config: SecurityMonitorConfig = {}) {
    this.config = {
      maxFailedAttempts: config.maxFailedAttempts || 5,
      lockoutDuration: config.lockoutDuration || 15 * 60 * 1000, // 15 minutes
      monitoringInterval: config.monitoringInterval || 60 * 1000, // 1 minute
      alertThreshold: config.alertThreshold || 3
    };

    this.failedAttempts = new Map();
    this.lockoutTimes = new Map();
    this.alerts = [];
  }

  recordFailedAttempt(userId: string): void {
    const attempts = (this.failedAttempts.get(userId) || 0) + 1;
    this.failedAttempts.set(userId, attempts);

    if (attempts >= this.config.maxFailedAttempts) {
      this.lockoutUser(userId);
    }
  }

  private lockoutUser(userId: string): void {
    this.lockoutTimes.set(userId, Date.now());
    this.alerts.push({
      type: 'lockout',
      userId,
      timestamp: Date.now(),
      reason: 'Too many failed attempts'
    });
  }

  isUserLocked(userId: string): boolean {
    const lockoutTime = this.lockoutTimes.get(userId);
    if (!lockoutTime) return false;

    const timeSinceLockout = Date.now() - lockoutTime;
    return timeSinceLockout < this.config.lockoutDuration;
  }

  clearFailedAttempts(userId: string): void {
    this.failedAttempts.delete(userId);
    this.lockoutTimes.delete(userId);
  }

  getAlerts(): any[] {
    return this.alerts;
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  monitorSecurityEvents(event: any): void {
    // Add security event monitoring logic here
    if (event.severity === 'high') {
      this.alerts.push({
        type: 'security_event',
        ...event,
        timestamp: Date.now()
      });
    }
  }

  checkThreats(data: any): boolean {
    // Add threat detection logic here
    const threatScore = this.calculateThreatScore(data);
    return threatScore < this.config.alertThreshold;
  }

  private calculateThreatScore(data: any): number {
    // Add threat scoring logic here
    let score = 0;
    
    // Example scoring logic
    if (data.source && !this.isValidSource(data.source)) {
      score += 2;
    }
    
    if (data.frequency && data.frequency > 100) {
      score += 1;
    }
    
    return score;
  }

  private isValidSource(source: string): boolean {
    // Add source validation logic here
    const validSources = ['api', 'web', 'mobile'];
    return validSources.includes(source);
  }
} 