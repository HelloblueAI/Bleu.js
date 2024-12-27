import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import winston from 'winston';
import apiRoutes from './routes/apiRoutes.ts';

// Convert __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, './.env') });

// Constants
const PORT = parseInt(process.env.PORT || '4003', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }: { timestamp: string; level: string; message: string }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// Middleware Configuration
const app: Express = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error Handler Middleware
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully.');
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`MongoDB connection error: ${error.message}`);
    } else {
      logger.error('Unknown error occurred during MongoDB connection.');
    }
    process.exit(1);
  }
};

// Graceful Shutdown
const gracefulShutdown = async () => {
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

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
};

startServer();

export { app, startServer, gracefulShutdown };
