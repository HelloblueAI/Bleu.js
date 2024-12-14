// Import dependencies
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import winston from 'winston';

import { monitorDependencies, resolveConflicts } from './dependencyManager.js';

// Initialize the Express app
const app = express();
const port = 3002;

// Set up Winston logger
const { createLogger, transports, format } = winston;
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message, ...meta }) =>
        `${timestamp} [${level}]: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta) : ''
        }`,
    ),
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Middleware for parsing JSON and CORS
app.use(bodyParser.json());
app.use(
  cors({
    origin: 'http://localhost:4002',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.get('/api/dependencies', (req, res) => {
  try {
    const result = monitorDependencies();
    logger.info('Dependencies monitored successfully', { result });
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ data: result });
  } catch (error) {
    logger.error('Error monitoring dependencies', { error: error.message });
    res.status(500).json({ error: 'Error monitoring dependencies' });
  }
});

app.get('/api/dependencies/conflicts', (req, res) => {
  try {
    const result = resolveConflicts();
    logger.info('Conflicts resolved successfully', { result });
    res.setHeader('Content-Type', 'application/json'); // Explicitly set Content-Type
    res.status(200).send(result);
  } catch (error) {
    logger.error('Error resolving conflicts', { error: error.message });
    res.setHeader('Content-Type', 'application/json'); // Explicitly set Content-Type
    res.status(500).send({ error: 'Error resolving conflicts' });
  }
});

// Start the server
app.listen(port, () => {
  logger.info(`Dependency Management running on port ${port}`);
  console.log(`Dependency Management running on port ${port}`);
});

// Export the app for testing or further integration
export default app;
