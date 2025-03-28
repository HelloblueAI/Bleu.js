import { createLogger } from '../utils/logger';

const logger = createLogger('auditLogger');

interface AuditEntry {
  timestamp: string;
  action: string;
  userId: string;
  resource: string;
  details: any;
  status: 'success' | 'failure';
}

export class SecurityAuditLogger {
  private entries: AuditEntry[];
  private maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.entries = [];
    this.maxEntries = maxEntries;
  }

  async logAudit(action: string, details: any): Promise<void> {
    try {
      const entry: AuditEntry = {
        timestamp: new Date().toISOString(),
        action,
        userId: details.userId || 'anonymous',
        resource: details.resource || 'unknown',
        details: details,
        status: details.status || 'success'
      };

      this.entries.push(entry);
      if (this.entries.length > this.maxEntries) {
        this.entries.shift();
      }

      logger.info(`Audit log: ${action} by ${entry.userId} on ${entry.resource}`);
    } catch (error) {
      logger.error('Failed to log audit:', error);
      throw error;
    }
  }

  getEntries(): AuditEntry[] {
    return [...this.entries];
  }

  getEntriesByUser(userId: string): AuditEntry[] {
    return this.entries.filter(entry => entry.userId === userId);
  }

  getEntriesByResource(resource: string): AuditEntry[] {
    return this.entries.filter(entry => entry.resource === resource);
  }

  getEntriesByStatus(status: 'success' | 'failure'): AuditEntry[] {
    return this.entries.filter(entry => entry.status === status);
  }

  clearEntries(): void {
    this.entries = [];
    logger.info('Audit log cleared');
  }

  setMaxEntries(max: number): void {
    this.maxEntries = max;
    while (this.entries.length > max) {
      this.entries.shift();
    }
    logger.info(`Max audit entries set to ${max}`);
  }

  async dispose(): Promise<void> {
    this.entries = [];
    logger.info('Audit logger disposed');
  }
} 