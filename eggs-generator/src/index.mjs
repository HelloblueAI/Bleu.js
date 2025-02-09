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
  description: Joi.string().required(),
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


app.post('/api/generate-egg', async (req, res) => {
  const { type, description, parameters } = req.body;

  logger.info('📥 Incoming Request', { type, description, parameters });


  const { error } = optionsSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const validationErrors = error.details.map((e) => e.message);
    logger.warn('⚠️ Validation Failed', { validationErrors });

    return res.status(400).json({
      error: 'Invalid input',
      details: validationErrors,
    });
  }

  try {
    logger.info('🛠 Generating Egg...');

    const result = await generateEgg({
      type,
      description,
      parameters,
      metadata: {
        size: parameters?.size || 'unknown',
        color: parameters?.color || 'unknown',
        generatedBy: 'Eggs-Generator v1.0.37',
        timestamp: new Date().toISOString(),
      },
    });

    logger.info('✅ Egg Generated Successfully', { result });

    return res.status(200).json({ result });
  } catch (err) {
    logger.error('❌ Egg Generation Failed', { error: err.message });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while generating the egg.',
    });
  }
});



app.use((err, req, res) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal Server Error' });
});


app.listen(PORT, () => {
  logger.info(`Eggs Generator running on port ${PORT}`);
});
