import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = format;

// Custom log format
const logFormat = printf(({ timestamp, level, message, stack }) => {
  return stack
    ? `${timestamp} [${level.toUpperCase()}]: ${message}\nStack Trace: ${stack}`
    : `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }), // Capture error stack traces
    logFormat,
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new transports.File({
      filename: 'logs/app.log',
      format: combine(timestamp(), json()),
    }),
  ],
});

// Export the logger
export default logger;

// Example usage
logger.info('✅ Logger initialized successfully.');
