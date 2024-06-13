import { createLogger, transports, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

class Logger {
  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
      transports: [
        new transports.Console(),
        new DailyRotateFile({
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d'
        })
      ],
    });
  }

  info(message, meta) {
    this.logger.info(message, meta);
  }

  error(message, meta) {
    this.logger.error(message, meta);
  }

  warn(message, meta) {
    this.logger.warn(message, meta);
  }

  debug(message, meta) {
    this.logger.debug(message, meta);
  }

  setCorrelationId(req) {
    const correlationId = req.headers['x-correlation-id'] || this.generateUniqueId();
    req.correlationId = correlationId;
    return correlationId;
  }

  generateUniqueId() {
    return Math.random().toString(36).substring(7);
  }

  performance(startTime, endTime, meta) {
    const duration = endTime - startTime;
    this.logger.info(`Performance: ${duration}ms`, meta);
  }
}

export default Logger;
