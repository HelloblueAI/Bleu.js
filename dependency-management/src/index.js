const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const winston = require('winston');

const { createLogger, transports, format } = winston;
const {
  monitorDependencies,
  resolveConflicts,
} = require('./dependencyManager'); // Ensure this path is correct

const app = express();
const port = 3002; // Ensure this matches your dependency management port

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    }),
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'logs/app.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

app.use(bodyParser.json());

app.use(
  cors({
    origin: 'http://localhost:4002',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request for ${req.url}`, {
    body: req.body,
  });
  next();
});

app.get('/api/dependencies', (req, res) => {
  try {
    const result = monitorDependencies();
    logger.info('Dependencies monitored successfully', { result });
    res.status(200).send(result);
  } catch (error) {
    logger.error('Error monitoring dependencies', { error: error.message });
    res.status(500).send('Error monitoring dependencies');
  }
});

app.get('/api/dependencies/conflicts', (req, res) => {
  try {
    const result = resolveConflicts();
    logger.info('Conflicts resolved successfully', { result });
    res.status(200).send(result);
  } catch (error) {
    logger.error('Error resolving conflicts', { error: error.message });
    res.status(500).send('Error resolving conflicts');
  }
});

app.listen(port, () => {
  logger.info(`Dependency Management running on port ${port}`);
  console.log(`Dependency Management running on port ${port}`);
});

module.exports = app;
