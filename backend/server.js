/* eslint-env node */
// backend/server.js
const express = require('express');
const winston = require('winston');

const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3007;

// Configure winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`,
    ),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'server.log' }),
  ],
});

app.use(express.json());
app.use('/api', apiRoutes);

let server;

const startServer = () => {
  return new Promise((resolve) => {
    if (!server) {
      server = app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        resolve();
      });
    }
  });
};

const stopServer = () => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('Server stopped');
        server = null;
        resolve();
      });
    }
  });
};

module.exports = { app, startServer, stopServer };
