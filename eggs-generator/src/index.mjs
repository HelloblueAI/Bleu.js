import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import winston from 'winston';

import { generateEgg } from './generateEgg.js';

const app = express();
const port = process.env.PORT || 3003;

// Initialize Winston Logger
const { createLogger, transports, format } = winston;
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message, ...meta }) =>
        `${timestamp} [${level.toUpperCase()}]: ${message} ${
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

// Middleware for parsing JSON
app.use(bodyParser.json());

// Configure CORS (Avoid duplicate manual header settings)
app.use(
  cors({
    origin: ['http://localhost:4002', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Health check route
app.get('/', (req, res) => {
  logger.info('Health check route accessed');
  res.status(200).json({ message: 'Eggs Generator Service is running!' });
});

// Generate egg route
app.post('/api/generate-egg', (req, res) => {
  const options = req.body;

  if (!options || typeof options !== 'object') {
    logger.warn('Invalid request body for generate-egg', { body: req.body });
    return res.status(400).json({ error: 'Invalid options in request body' });
  }

  try {
    const result = generateEgg(options);
    logger.info('Egg generated successfully', { options, result });
    res.status(200).json({ success: true, egg: result });
  } catch (error) {
    logger.error('Error generating egg', {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ error: 'Failed to generate egg', details: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res
    .status(500)
    .json({ error: 'Internal Server Error', details: err.message });
});

// Start the server
app.listen(port, () => {
  logger.info(`Eggs Generator running on port ${port}`);
  console.log(`Eggs Generator running on port ${port}`);
});

export default app;
