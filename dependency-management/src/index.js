const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const winston = require('winston');

const { createLogger, transports, format } = winston;
const {
  monitorDependencies,
  resolveConflicts,
} = require('./dependencyManager');

const app = express();
const port = 3002;

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message, ...meta }) =>
        `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`,
    ),
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
  res.header('Access-Control-Allow-Origin', 'http://localhost:4002');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  return next();
});

app.get('/api/dependencies', (req, res) => {
  try {
    const result = monitorDependencies();
    logger.info('Dependencies monitored successfully', { result });
    return res.status(200).send(result);
  } catch (error) {
    logger.error('Error monitoring dependencies', { error: error.message });
    return res.status(500).send('Error monitoring dependencies');
  }
});

app.get('/api/dependencies/conflicts', (req, res) => {
  try {
    const result = resolveConflicts();
    logger.info('Conflicts resolved successfully', { result });
    return res.status(200).send(result);
  } catch (error) {
    logger.error('Error resolving conflicts', { error: error.message });
    return res.status(500).send('Error resolving conflicts');
  }
});

app.listen(port, () => {
  logger.info(`Dependency Management running on port ${port}`);
  console.log(`Dependency Management running on port ${port}`);
});

module.exports = app;
