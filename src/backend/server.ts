import path from 'path';
import { fileURLToPath } from 'url';

import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

import apiRoutes from './routes/apiRoutes.js';

// Convert __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, './.env') });

// Constants
const PORT = process.env['PORT'] || 4003;
const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017';

// Logger configuration
const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),

    winston.format.printf(
      ({
        timestamp,
        level,
        message,
      }: {
        timestamp: string;
        level: string;
        message: string;
      }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`,
    ),
  ),
  transports: [new winston.transports.Console()],
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected.');
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`MongoDB connection error: ${error.message}`);
    } else {
      logger.error('Unknown error occurred during MongoDB connection.');
    }
    process.exit(1);
  }
};

// Middleware Configuration
/** @type {import('express').Express} */
const app: express.Express = express();
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Graceful Shutdown
const stopServer = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected.');
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error during shutdown: ${error.message}`);
    } else {
      logger.error('Unknown error occurred during shutdown.');
    }
    process.exit(1);
  }
};

process.on('SIGINT', stopServer);
process.on('SIGTERM', stopServer);

// Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
};

startServer();

export { app, startServer, stopServer };
