const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const getPort = require('get-port');
const mongoose = require('mongoose');

// Required environment variables
const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'PORT',
  'JWT_SECRET',
  'CORE_ENGINE_URL',
];

/**
 * Function to verify that all required environment variables are set.
 * Exits the process with an error message if any variables are missing.
 */
const checkEnvVars = () => {
  const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missingVars.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
    process.exit(1); // Exit if required environment variables are not set
  }
};

// Check environment variables at startup
checkEnvVars();

const {
  monitorDependencies,
  resolveConflicts,
} = require('../dependency-management/src/index');
const { generateEgg } = require('../eggs-generator/src/index');

const apiRoutes = require('./routes/apiRoutes');
const decisionTreeService = require('./services/decisionTreeService');
const database = require('./services/database');

/**
 * Function to create the Express application with middleware and routes.
 * @returns {object} Express app
 */
const createApp = () => {
  const app = express();

  // Middleware setup
  app.use(cors());
  app.use(morgan('dev'));
  app.use(bodyParser.json());

  // API routes
  app.use('/api', apiRoutes);

  // AI Service Route
  app.post('/api/aiService', async (req, res) => {
    try {
      const { input } = req.body;
      if (!input) {
        return res.status(400).json({ error: 'Missing input' });
      }
      const result = await decisionTreeService.traverseDecisionTree(input);
      return res.status(200).json({ result });
    } catch (error) {
      console.error('Error in /api/aiService:', error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  // Dependencies Route
  app.get('/api/dependencies', async (req, res) => {
    try {
      const { dependencies, outdated } = await monitorDependencies();
      return res.status(200).json({ dependencies, outdated });
    } catch (error) {
      console.error('Error in /api/dependencies:', error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  // Dependency Conflicts Route
  app.get('/api/dependencies/conflicts', async (req, res) => {
    try {
      const { resolved, conflicts } = await resolveConflicts();
      return res.status(200).json({ resolved, conflicts });
    } catch (error) {
      console.error('Error in /api/dependencies/conflicts:', error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  // Egg Generation Route
  app.post('/api/generate-egg', async (req, res) => {
    try {
      const eggOptions = req.body;
      const generatedEgg = await generateEgg(eggOptions);
      return res.status(200).json({ egg: generatedEgg });
    } catch (error) {
      console.error('Error in /api/generate-egg:', error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  // Database Seeding Route
  app.post('/api/seedDatabase', async (req, res) => {
    try {
      const { data, model } = req.body;
      if (!data || !model) {
        return res.status(400).json({ error: 'Missing data or model' });
      }
      const result = await database.seed(data, model);
      return res.status(200).json({
        message: 'Database seeded successfully',
        ...result,
      });
    } catch (error) {
      console.error('Error in /api/seedDatabase:', error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  return app;
};

/**
 * Function to start the server and connect to MongoDB.
 * @returns {Promise<object>} App and Server instances
 */
const startServer = async () => {
  const port = await getPort({ port: process.env.PORT || 4003 });

  try {
    // MongoDB connection
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit if MongoDB connection fails
  }

  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${server.address().port}`);
  });

  return { app, server };
};

/**
 * Function to stop the server and disconnect MongoDB.
 * @param {object} server - The server instance
 * @returns {Promise<void>}
 */
const stopServer = async (server) => {
  return new Promise((resolve) => {
    server.close(async () => {
      console.log('Server closed');
      await mongoose.disconnect(); // Disconnect from MongoDB
      resolve();
    });
  });
};

module.exports = { createApp, startServer, stopServer };
