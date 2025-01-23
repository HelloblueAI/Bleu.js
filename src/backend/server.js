import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import getPort from 'get-port';
import morgan from 'morgan';
import { createLogger, transports, format } from 'winston';

import apiRoutes from './routes/apiRoutes.js';
import database from './services/database.js';
import decisionTreeService from './services/decisionTreeService.js';

// Logger Configuration
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
    })
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

// Centralized Error Handling

const stopServer = (server) =>
  new Promise((resolve, reject) => {
    server.close(async (err) => {
      if (err) {
        logger.error('Error while stopping server:', err.message);
        return reject(err);
      }
      logger.info('Server stopped.');
      await database.disconnect();
      return resolve();
    });
  });

// Define API Endpoints
const configureEndpoints = (app) => {
  app.use('/api', apiRoutes);

  app.post('/api/aiService', async (req, res) => {
    try {
      const { input } = req.body;
      if (!input) {
        return res.status(400).json({ error: 'Input is required' }); // Ensure return
      }

      const result = await decisionTreeService.traverseDecisionTree(input);
      return res.status(200).json({ result }); // Ensure return
    } catch (error) {
      logger.error('Error in aiService endpoint:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' }); // Ensure return
    }
  });

  // Additional endpoints can be added here
};

// Initialize Express App
const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
  app.use(bodyParser.json());

  // Configure Endpoints
  configureEndpoints(app);

  // Global 404 Handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
};

const startServer = async () => {
  try {
    const app = createApp();
    const port = await getPort({ port: process.env.PORT || 4003 });
    await database.connect();

    const server = app.listen(port, () => {
      logger.info(`Server running at http://localhost:${port}`);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down server...');
      await stopServer(server);
    });

    return { app, server }; // Ensure return
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    return null; // Add a fallback return value
  }
};

// Export for Testing
export { createApp, startServer, stopServer };
