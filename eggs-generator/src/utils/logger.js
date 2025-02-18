import { createLogger, transports, format } from 'winston';

/** 🚀 Centralized Logger */
export const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024,
    }),
    new transports.File({
      filename: 'logs/app.log',
      maxsize: 10 * 1024 * 1024,
    }),
  ],
});
