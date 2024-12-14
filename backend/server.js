import path from 'path';

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import winston from 'winston';
import cors from 'cors';

import apiRoutes from './routes/apiRoutes.js';

// Load environment variables from the .env file in the backend folder
dotenv.config({ path: './backend/.env' });

console.log('Environment Variables Loaded:', process.env);
console.log(
  'Loaded OpenAI API Key:',
  process.env.OPENAI_API_KEY ? '*****' : 'API key is missing',
);

const app = express();
const PORT = process.env.PORT || 4003;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bleujs';

// Set up Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({ filename: 'server.log', level: 'info' }),
  ],
});

// MongoDB connection with retry mechanism
const connectDB = async () => {
  const maxRetries = 5;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      await mongoose.connect(MONGODB_URI);
      logger.info('MongoDB connected successfully');
      return; // Exit the function once connected
    } catch (error) {
      attempts += 1;
      logger.error(
        `MongoDB connection attempt ${attempts} failed: ${error.message}`,
      );

      if (attempts >= maxRetries) {
        logger.error('Max retries reached, shutting down server');
        process.exit(1);
      }

      logger.info('Retrying MongoDB connection...');
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Retry after 5 seconds
    }
  }
};

// Configure CORS options
const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.CORS_ENABLED === 'true' && origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json()); // Middleware to parse JSON requests

// Set up API routes
app.use('/api', apiRoutes);

// Serve static frontend files
const frontendDir = path.join(__dirname, '../frontend/public');
app.use(express.static(frontendDir));

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Gracefully stop the server
let server;
const stopServer = () => {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err) => {
        if (err) {
          logger.error('Error stopping the server:', err);
          reject(err);
        } else {
          logger.info('Server stopped gracefully');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

// Graceful shutdown on signals
process.on('SIGINT', async () => {
  logger.info('SIGINT signal received. Shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

// Start the server with MongoDB connection validation
const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Error starting the server:', error);
    console.error('Error starting the server:', error);
  }
};

// Export app and server controls for testing
export { app, startServer, stopServer };

// Automatically start the server
startServer().catch((error) => {
  logger.error('Failed to start the server:', error);
  console.error('Failed to start the server:', error);
});
