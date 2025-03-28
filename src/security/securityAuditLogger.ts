import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../utils/logger';

export interface AuditConfig {
  enabled?: boolean;
  retentionDays?: number;
  logPath?: string;
  logLevel?: 'info' | 'warn' | 'error';
  maxFileSize?: number;
  maxFiles?: number;
}

export interface AuditEvent {
  type: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource?: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  outcome?: 'success' | 'failure';
  metadata?: Record<string, any>;
}

export class SecurityAuditLogger {
  private logger = createLogger('SecurityAuditLogger');
  private config: Required<AuditConfig>;
  private currentLogFile: string;
  private currentFileSize: number;
  private rotationInterval: NodeJS.Timeout | null;

  constructor(config: AuditConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      retentionDays: config.retentionDays ?? 30,
      logPath: config.logPath ?? 'logs/security',
      logLevel: config.logLevel ?? 'info',
      maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles ?? 10
    };

    this.currentLogFile = '';
    this.currentFileSize = 0;
    this.rotationInterval = null;
  }

  async initialize(): Promise<void> {
    try {
      // Create log directory if it doesn't exist
      await fs.mkdir(this.config.logPath, { recursive: true });

      // Initialize log file
      await this.rotateLogFile();

      // Set up automatic log rotation
      this.rotationInterval = setInterval(() => {
        this.checkRotation().catch(error => {
          this.logger.error('Failed to check log rotation:', error);
        });
      }, 60000); // Check every minute

      this.logger.info('Security audit logger initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize security audit logger:', error);
      throw error;
    }
  }

  async logEvent(event: AuditEvent): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const logEntry = this.formatLogEntry(event);
      await this.writeLog(logEntry);
    } catch (error) {
      this.logger.error('Failed to log audit event:', error);
      throw error;
    }
  }

  private formatLogEntry(event: AuditEvent): string {
    const entry = {
      ...event,
      timestamp: event.timestamp.toISOString(),
      hostname: require('os').hostname(),
      processId: process.pid
    };

    return JSON.stringify(entry) + '\n';
  }

  private async writeLog(logEntry: string): Promise<void> {
    try {
      await fs.appendFile(this.currentLogFile, logEntry);
      this.currentFileSize += Buffer.byteLength(logEntry);

      // Check if rotation is needed
      if (this.currentFileSize >= this.config.maxFileSize) {
        await this.rotateLogFile();
      }
    } catch (error) {
      this.logger.error('Failed to write log entry:', error);
      throw error;
    }
  }

  private async rotateLogFile(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.currentLogFile = path.join(
        this.config.logPath,
        `security-audit-${timestamp}.log`
      );
      this.currentFileSize = 0;

      // Create new log file
      await fs.writeFile(this.currentLogFile, '');

      // Clean up old log files
      await this.cleanupOldLogs();
    } catch (error) {
      this.logger.error('Failed to rotate log file:', error);
      throw error;
    }
  }

  private async checkRotation(): Promise<void> {
    try {
      const stats = await fs.stat(this.currentLogFile);
      if (stats.size >= this.config.maxFileSize) {
        await this.rotateLogFile();
      }
    } catch (error) {
      this.logger.error('Failed to check log rotation:', error);
      throw error;
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.logPath);
      const logFiles = files.filter(file => file.startsWith('security-audit-'));

      // Sort files by creation time
      const fileStats = await Promise.all(
        logFiles.map(async file => {
          const filePath = path.join(this.config.logPath, file);
          const stats = await fs.stat(filePath);
          return { file, stats };
        })
      );

      fileStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // Remove excess files
      const filesToRemove = fileStats.slice(this.config.maxFiles);
      await Promise.all(
        filesToRemove.map(({ file }) =>
          fs.unlink(path.join(this.config.logPath, file))
        )
      );

      // Remove old files based on retention period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      await Promise.all(
        fileStats.map(async ({ file, stats }) => {
          if (stats.mtime < cutoffDate) {
            await fs.unlink(path.join(this.config.logPath, file));
          }
        })
      );
    } catch (error) {
      this.logger.error('Failed to cleanup old logs:', error);
      throw error;
    }
  }

  async getEvents(options: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
    userId?: string;
    severity?: AuditEvent['severity'];
  } = {}): Promise<AuditEvent[]> {
    try {
      const events: AuditEvent[] = [];
      const files = await fs.readdir(this.config.logPath);
      const logFiles = files.filter(file => file.startsWith('security-audit-'));

      for (const file of logFiles) {
        const content = await fs.readFile(
          path.join(this.config.logPath, file),
          'utf8'
        );
        const lines = content.split('\n').filter(Boolean);

        for (const line of lines) {
          const event = JSON.parse(line) as AuditEvent;
          event.timestamp = new Date(event.timestamp);

          if (this.matchesFilter(event, options)) {
            events.push(event);
          }
        }
      }

      return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      this.logger.error('Failed to retrieve audit events:', error);
      throw error;
    }
  }

  private matchesFilter(
    event: AuditEvent,
    filter: {
      startDate?: Date;
      endDate?: Date;
      type?: string;
      userId?: string;
      severity?: AuditEvent['severity'];
    }
  ): boolean {
    if (filter.startDate && event.timestamp < filter.startDate) return false;
    if (filter.endDate && event.timestamp > filter.endDate) return false;
    if (filter.type && event.type !== filter.type) return false;
    if (filter.userId && event.userId !== filter.userId) return false;
    if (filter.severity && event.severity !== filter.severity) return false;
    return true;
  }

  async dispose(): Promise<void> {
    try {
      if (this.rotationInterval) {
        clearInterval(this.rotationInterval);
        this.rotationInterval = null;
      }

      this.currentLogFile = '';
      this.currentFileSize = 0;
      this.logger.info('Security audit logger disposed successfully');
    } catch (error) {
      this.logger.error('Failed to dispose security audit logger:', error);
      throw error;
    }
  }
} 