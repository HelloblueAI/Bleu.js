import { SecurityAuditLogger } from './securityAuditLogger';
import { SecurityPolicy } from './policy';
import { SecurityError } from '../errors/securityError';

export class SecurityAuditor {
  private auditLogger: SecurityAuditLogger;
  private policy: SecurityPolicy;

  constructor(policy: SecurityPolicy) {
    this.auditLogger = new SecurityAuditLogger();
    this.policy = policy;
  }

  async auditAccess(resource: string, user: string): Promise<boolean> {
    try {
      const isAllowed = await this.policy.checkAccess(resource, user);
      await this.auditLogger.logAccess({
        resource,
        user,
        allowed: isAllowed,
        timestamp: new Date()
      });
      return isAllowed;
    } catch (error) {
      await this.auditLogger.logError({
        type: 'ACCESS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      throw new SecurityError('Access audit failed');
    }
  }

  async auditOperation(operation: string, details: Record<string, any>): Promise<void> {
    try {
      await this.auditLogger.logOperation({
        operation,
        details,
        timestamp: new Date()
      });
    } catch (error) {
      await this.auditLogger.logError({
        type: 'OPERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      throw new SecurityError('Operation audit failed');
    }
  }

  async auditSecurityEvent(eventType: string, severity: 'LOW' | 'MEDIUM' | 'HIGH', details: Record<string, any>): Promise<void> {
    try {
      await this.auditLogger.logSecurityEvent({
        type: eventType,
        severity,
        details,
        timestamp: new Date()
      });
    } catch (error) {
      await this.auditLogger.logError({
        type: 'SECURITY_EVENT_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      throw new SecurityError('Security event audit failed');
    }
  }

  async getAuditLogs(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      return await this.auditLogger.getLogs(startDate, endDate);
    } catch (error) {
      throw new SecurityError('Failed to retrieve audit logs');
    }
  }
} 