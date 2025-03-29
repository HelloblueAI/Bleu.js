export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogMetadata {
  service?: string;
  timestamp?: string;
  level?: LogLevel;
  message?: string;
  [key: string]: any;
}

export interface Logger {
  error(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  info(message: string, ...meta: any[]): void;
  debug(message: string, ...meta: any[]): void;
  trace(message: string, ...meta: any[]): void;
  logWithContext(level: string, message: string, context: any): void;
  logError(error: Error, context?: any): void;
  logMetrics(metrics: any): void;
  logSecurity(event: string, details: any): void;
  logAudit(action: string, details: any): void;
} 