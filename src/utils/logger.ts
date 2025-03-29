import { Logger } from 'winston';
import winston from 'winston';
import { BleuConfig } from '../types/config.js';
import { MonitoringError } from '../types/errors.js';
import { LogLevel, LogMetadata } from '../types/logging.js';

// Custom log levels
const logLevels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
};

// Custom log colors
const logColors: Record<LogLevel, string> = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  trace: 'gray'
};

// Custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.prettyPrint(),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }: LogMetadata) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (metadata && Object.keys(metadata).length > 0) {
      msg += '\n' + JSON.stringify(metadata, null, 2);
    }
    return msg;
  })
);

export interface ILogger {
  info(message: string, ...args: any[]): void;
  error(message: string, error?: Error | unknown, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  security(message: string, ...args: any[]): void;
  audit(message: string, ...args: any[]): void;
  performance(message: string, ...args: any[]): void;
}

export interface LoggerOptions {
  level?: string;
  format?: winston.Logform.Format;
}

export class CustomLogger implements ILogger {
  private logger: Logger;

  constructor(winstonLogger: Logger) {
    this.logger = winstonLogger;
  }

  info(message: string, ...args: any[]): void {
    this.logger.info(message, ...args);
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    this.logger.error(message, error, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.logger.warn(message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.logger.debug(message, ...args);
  }

  security(message: string, ...args: any[]): void {
    this.logger.warn(`[SECURITY] ${message}`, ...args);
  }

  audit(message: string, ...args: any[]): void {
    this.logger.info(`[AUDIT] ${message}`, ...args);
  }

  performance(message: string, ...args: any[]): void {
    this.logger.info(`[PERFORMANCE] ${message}`, ...args);
  }
}

export function createLogger(options: {
  level?: string;
  format?: winston.Logform.Format;
  transports?: winston.transport[];
} = {}): Logger {
  const {
    level = 'info',
    format = winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  } = options;

  return winston.createLogger({
    level,
    format,
    transports
  });
}

// Create a mock logger for testing
export class MockLogger implements ILogger {
  private context: string;
  private console: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
    debug: jest.SpyInstance;
  };
  
  constructor(console = global.console) {
    this.context = 'test';
    this.console = {
      log: jest.spyOn(console, 'log'),
      error: jest.spyOn(console, 'error'),
      warn: jest.spyOn(console, 'warn'),
      debug: jest.spyOn(console, 'debug')
    };
  }

  info = (message: string, ...args: any[]): void => {
    this.console.log(`[${this.context}] INFO: ${message}`, ...args);
  };
  
  error = (message: string, error?: Error | unknown, ...args: any[]): void => {
    this.console.error(`[${this.context}] ERROR: ${message}`, error, ...args);
  };
  
  warn = (message: string, ...args: any[]): void => {
    this.console.warn(`[${this.context}] WARN: ${message}`, ...args);
  };
  
  debug = (message: string, ...args: any[]): void => {
    this.console.debug(`[${this.context}] DEBUG: ${message}`, ...args);
  };
  
  security = (message: string, ...args: any[]): void => {
    this.console.warn(`[${this.context}] SECURITY: ${message}`, ...args);
  };
  
  audit = (message: string, ...args: any[]): void => {
    this.console.log(`[${this.context}] AUDIT: ${message}`, ...args);
  };
  
  performance = (message: string, ...args: any[]): void => {
    this.console.log(`[${this.context}] PERFORMANCE: ${message}`, ...args);
  };
}

// Export a default logger instance
export const defaultLogger = new CustomLogger(winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
}));