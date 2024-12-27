import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: 'info',

  format: format.combine(
    format.timestamp(),

    format.tson(),
  ),

  transports: [
    new transports.Console(),

    new transports.File({ filename: 'combined.log' }),
  ],
});

export default logger;
