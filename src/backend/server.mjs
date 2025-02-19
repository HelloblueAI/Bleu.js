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
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import getPort from 'get-port';
import morgan from 'morgan';
import { createLogger, transports, format } from 'winston';

import apiRoutes from './src/routes/apiRoutes.js';
import { connect, disconnect } from './mocks/database.js';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
    }),
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'logs/server.log',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

const stopServer = (server) =>
  new Promise((resolve, reject) => {
    server.close(async (err) => {
      if (err) {
        logger.error('Error while stopping server:', err.message);
        return reject(err);
      }
      logger.info('Server stopped.');
      await disconnect();
      return resolve();
    });
  });

const configureEndpoints = (app) => {
  app.use('/api', apiRoutes);

  app.post('/api/aiService', async (req, res) => {
    try {
      const { input } = req.body;
      if (!input) {
        return res.status(400).json({ error: 'Input is required' });
      }

      const result = await traverseDecisionTree(input);
      return res.status(200).json({ result });
    } catch (error) {
      logger.error('Error in aiService endpoint:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};

const createApp = () => {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    }),
  );
  app.use(bodyParser.json());

  configureEndpoints(app);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
};

const startServer = async () => {
  try {
    const app = createApp();
    const port = await getPort({ port: process.env.PORT || 4003 });
    await connect();

    const server = app.listen(port, () => {
      logger.info(`Server running at http://localhost:${port}`);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down server...');
      await stopServer(server);
    });

    return { app, server };
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    return null;
  }
};

export { createApp, startServer, stopServer };
