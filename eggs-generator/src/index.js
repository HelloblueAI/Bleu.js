const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const winston = require('winston');

const { createLogger, transports, format } = winston;
const { generateEgg } = require('./generateEgg');

const app = express();
const port = 3003;

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

app.post('/api/generate-egg', (req, res) => {
  const options = req.body;
  console.log('Received generate-egg request:', options); // Debug log
  try {
    const result = generateEgg(options);
    logger.info('Egg generated successfully', { options, result });
    console.log('Egg generated successfully:', result); // Debug log
    return res.status(200).send(result);
  } catch (error) {
    logger.error('Error generating egg', { options, error: error.message });
    console.error('Error generating egg:', error); // Debug log
    return res.status(500).send('Error generating egg');
  }
});

app.listen(port, () => {
  logger.info(`Eggs Generator running on port ${port}`);
  console.log(`Eggs Generator running on port ${port}`);
});

module.exports = app;
