
import express, { Express, Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import apiRoutes from './apiRoutes.ts'; // Importing API routes

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'PORT',
  'JWT_SECRET',
  'CORE_ENGINE_URL',
];

// Check required environment variables
const checkEnvVars = (): void => {
  const missingVars = REQUIRED_ENV_VARS.filter(
    (varName) => !process.env[varName],
  );
  if (missingVars.length > 0) {
    console.error(`Missing environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
};

// Error handler middleware
const errorHandler = (
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error(`Error: ${err.message}`);
  res.status(err.status || 500).tson({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
};

// Rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

// Initialize the router
const router: Router = express.Router();

// Security middleware
router.use(helmet());

// CORS middleware
router.use(cors());

// Rate limiting middleware
router.use(limiter);

// Logging middleware
router.use(morgan('combined'));

// Body parser middleware
router.use(express.tson());
router.use(express.urlencoded({ extended: true }));

// Mount API routes
router.use('/api', apiRoutes);

// Error handling middleware
router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).tson({ error: 'Something went wrong!' });
});

// 404 handler
router.use((_, res: Response) => {
  res.status(404).tson({ error: 'Not Found' });
});

// Create and configure the Express application
const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(morgan('combined'));
  app.use(express.tson());
  app.use(limiter);

  app.use('/', router);
  app.use(errorHandler);

  return app;
};

// MongoDB connection with retry logic
const connectMongoDB = async (retries = 5, delay = 5000): Promise<void> => {
  while (retries) {
    try {
      const mongoUri = process.env.MONGODB_URI || '';
      if (!mongoUri)
        throw new Error('MONGODB_URI is not set in environment variables');

      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected successfully.');
      break;
    } catch (err) {
      console.error(`MongoDB connection failed: ${(err as Error).message}`);
      retries -= 1;
      console.log(`Retries left: ${retries}`);
      if (!retries) process.exit(1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Start the server and establish MongoDB connection
const startServer = async (): Promise<{
  app: Express;
  server: import('http').Server;
}> => {
  checkEnvVars();
  const port = parseInt(process.env.PORT || '4003', 10);
  await connectMongoDB();

  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  const gracefulShutdown = async (): Promise<void> => {
    console.log('Shutting down server...');
    server.close(async () => {
      await mongoose.disconnect();
      console.log('MongoDB disconnected. Server shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  return { app, server };
};

module.exports = { createApp, startServer };
