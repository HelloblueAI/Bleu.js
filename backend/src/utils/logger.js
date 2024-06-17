// backend/src/utils/logger.js
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    // Add other transports here, like File transport
  ],
});

module.exports = logger;
