import express from 'express';
import bodyParser from 'body-parser';
import Joi from 'joi';
import { createLogger, transports, format } from 'winston';
import compression from 'compression';
import { generateEgg } from './generateEgg.js';

const { json } = bodyParser;

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

const optionsSchema = Joi.object({
  type: Joi.string().required(),
  parameters: Joi.object().optional(),
}).required();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(json());

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

app.use((err, req, res) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  logger.info(`Eggs Generator running on port ${PORT}`);
});
