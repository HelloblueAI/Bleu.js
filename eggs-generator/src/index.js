import express from 'express';
import { json } from 'body-parser';
import { object, string } from 'joi';
import { createLogger, transports, format } from 'winston';
import compression from 'compression';

import { generateEgg } from './generateEgg.js';

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
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

const optionsSchema = object({
  type: string().required(),
  parameters: object().optional(),
}).required();

// Express App Setup
const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(json());

// Enhanced CORS Middleware
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:4002'];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'http://localhost:4002');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With',
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return next();
});

app.use(compression());

// Routes
app.post('/api/generate-egg', async (req, res) => {
  const { error } = optionsSchema.validate(req.body);
  if (error) {
    logger.warn('Validation failed', { error: error.message });
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const result = await generateEgg(req.body);
    logger.info('Egg generated successfully', { result });
    return res.status(200).json({ result });
  } catch (err) {
    logger.error('Error generating egg', { error: err.message });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Global Error Handler
app.use((err, req, res) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  logger.info(`Eggs Generator running on port ${PORT}`);
});
