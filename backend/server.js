// Import dependencies
const path = require('path');

const express = require('express');
const winston = require('winston');
const mongoose = require('mongoose');
const cors = require('cors');
const openai = require('openai'); // Updated to use OpenAI directly

const apiRoutes = require('./routes/apiRoutes'); // Import API routes

// Initialize the Express application
const app = express();

// Set up environment variables
const PORT = process.env.PORT || 4003;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bleujs';

// Configure OpenAI API key directly from environment variables
if (process.env.OPENAI_API_KEY) {
  openai.apiKey = process.env.OPENAI_API_KEY;
} else {
  console.error(
    'OpenAI API key is missing. Please set OPENAI_API_KEY in your environment variables.',
  );
}

// Set up Winston logger for logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`,
    ),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'server.log' }), // Log to file
  ],
});

// Connect to MongoDB using Mongoose
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error', error);
    process.exit(1); // Exit process on connection failure
  }
};

// Set up CORS configuration
app.use(
  cors({
    origin: 'http://localhost:4002', // Allow specific origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    credentials: true, // Allow credentials (cookies, etc.)
  }),
);

// Parse incoming JSON requests
app.use(express.json());

// Use API routes for backend functionality
app.use('/api', apiRoutes);

// Serve static frontend files
const frontendDir = path.join(__dirname, '../frontend/public');
app.use(express.static(frontendDir));

// Serve frontend index.html for all other routes (Single Page Application setup)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

let server;

// Function to start the server
const startServer = async () => {
  try {
    await connectDB(); // Ensure MongoDB connection before starting the server
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Error starting the server', { error });
    console.error('Error starting the server:', error);
  }
};

// Function to stop the server gracefully
const stopServer = () => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('Server stopped');
        console.log('Server stopped');
        server = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
};

// Export the app and server control functions
module.exports = { app, startServer, stopServer };

// Start the server immediately
startServer().catch((error) => {
  console.error('Failed to start the server:', error);
});
