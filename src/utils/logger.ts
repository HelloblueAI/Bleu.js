import winston from 'winston';
import { format } from 'winston';

export interface LoggerOptions {
  level?: string;
  format?: winston.Logform.Format;
  transports?: winston.transport[];
}

export class Logger {
  private logger: winston.Logger;
  private static instances: Map<string, Logger> = new Map();

  private constructor(options: LoggerOptions = {}) {
    this.logger = winston.createLogger({
      level: options.level || 'info',
      format: options.format || format.combine(
        format.timestamp(),
        format.json(),
        format.errors({ stack: true })
      ),
      transports: options.transports || [
        new winston.transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        }),
        new winston.transports.File({ 
          filename: 'error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({ 
          filename: 'combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });
  }

  static getInstance(name: string, options?: LoggerOptions): Logger {
    if (!this.instances.has(name)) {
      this.instances.set(name, new Logger(options));
    }
    return this.instances.get(name)!;
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  trace(message: string, meta?: any): void {
    this.logger.silly(message, meta);
  }
}

export const createLogger = (name: string, options?: LoggerOptions): Logger => {
  return Logger.getInstance(name, options);
};

export const logger = createLogger();