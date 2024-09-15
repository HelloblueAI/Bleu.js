const path = require('path');

const express = require('express');
const winston = require('winston');
const mongoose = require('mongoose');
const cors = require('cors');

const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 4003;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bleujs';

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
    new winston.transports.File({ filename: 'server.log' }),
  ],
});

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error', error);
    process.exit(1);
  }
};

app.use(
  cors({
    origin: 'http://localhost:4002',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.use(express.json());
app.use('/api', apiRoutes);

const frontendDir = path.join(__dirname, '../frontend/public');
app.use(express.static(frontendDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Error starting the server', { error });
    console.error('Error starting the server:', error);
  }
};

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

module.exports = { app, startServer, stopServer };

startServer().catch((error) => {
  console.error('Failed to start the server:', error);
});
