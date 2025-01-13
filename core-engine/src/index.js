import express from 'express';
import { json } from 'body-parser';
import cors from 'cors';
import winston from 'winston';
const { createLogger, transports, format } = winston;

const app = express();
const port = 3001;

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

function debugCode(code) {
  return `Debugged code: ${code}`;
}

function optimizeCode(code) {
  return code.replace(/\s+/g, ' ').trim();
}

function generateCode(template) {
  return `Generated code from template: ${template}`;
}

app.use(json());

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

app.post('/debug', (req, res) => {
  const { code } = req.body;
  try {
    const result = debugCode(code);
    logger.info('Code debugged successfully', { code, result });
    return res.status(200).send(result);
  } catch (error) {
    logger.error('Error debugging code', { code, error: error.message });
    return res.status(500).send('Error debugging code');
  }
});

app.post('/optimize', (req, res) => {
  const { code } = req.body;
  try {
    const result = optimizeCode(code);
    logger.info('Code optimized successfully', { code, result });
    return res.status(200).send(result);
  } catch (error) {
    logger.error('Error optimizing code', { code, error: error.message });
    return res.status(500).send('Error optimizing code');
  }
});

app.post('/generate', (req, res) => {
  const { template } = req.body;
  try {
    const result = generateCode(template);
    logger.info('Code generated successfully', { template, result });
    return res.status(200).send(result);
  } catch (error) {
    logger.error('Error generating code', { template, error: error.message });
    return res.status(500).send('Error generating code');
  }
});

app.listen(port, () => {
  logger.info(`Core Engine running on port ${port}`);
  console.log(`Core Engine running on port ${port}`);
});

export default app;
