//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.mjs';
import morgan from 'morgan';
import { createLogger, transports, format } from 'winston';
import { connect, disconnect } from './database/db.mjs';
import apiRoutes from './routes.mjs';
import os from 'os';
import cluster from 'cluster';

const PORT = process.env.PORT || 4003;
const NUM_CPUS = os.cpus().length;


const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/server.log', maxsize: 5 * 1024 * 1024, maxFiles: 5 })
  ],
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.'
});

const startServer = async () => {
  await connect();

  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));

  app.use(bodyParser.json());
  app.use(morgan('combined'));
  app.use(limiter);


  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


  app.use('/api', apiRoutes);


  app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to Bleu.js API!' });
  });


  app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  });

  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running at http://localhost:${PORT}`);
  });


  process.on('SIGTERM', async () => {
    logger.info('Shutting down server...');
    await disconnect();
    server.close(() => {
      logger.info('Server stopped.');
      process.exit(0);
    });
  });
};


if (cluster.isPrimary) {
  logger.info(`Primary process ${process.pid} is running`);
  for (let i = 0; i < NUM_CPUS; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  startServer();
}
