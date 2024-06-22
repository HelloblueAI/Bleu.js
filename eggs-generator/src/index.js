const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const winston = require('winston');

const { createLogger, transports, format } = winston;
const { generateEgg } = require('./generateEgg');

const app = express();
const port = 3001;

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

app.post('/api/generate-egg', (req, res) => {
  const options = req.body;
  try {
    const result = generateEgg(options);
    logger.info('Egg generated successfully', { options, result });
    res.status(200).send(result);
  } catch (error) {
    logger.error('Error generating egg', { options, error: error.message });
    res.status(500).send('Error generating egg');
  }
});

app.listen(port, () => {
  logger.info(`Eggs Generator running on port ${port}`);
  console.log(`Eggs Generator running on port ${port}`);
});
