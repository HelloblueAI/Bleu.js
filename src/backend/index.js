import { json } from 'body-parser';
import cors from 'cors';
import express from 'express';
import getPort from 'get-port';
import morgan from 'morgan';

import dependencyManagement from '../dependency-management/src/index';
const { monitorDependencies, resolveConflicts } = dependencyManagement;
import _default from '../eggs-generator/src/index';
const { generateEgg } = _default;

import apiRoutes from './routes/apiRoutes';
import { seed, disconnect } from './services/database';
import decisionTreeService from './services/decisionTreeService';

const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(morgan('dev'));
  app.use(json());

  app.use('/api', apiRoutes); 

  app.post('/api/aiService', async (req, res) => {
    try {
      if (!req.body.input) {
        return res.status(400).json({ error: 'Missing input' });
      }
      const result = await decisionTreeService.traverseDecisionTree(
        req.body.input,
      );
      return res.status(200).json({ result });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/dependencies', async (req, res) => {
    try {
      const { dependencies, outdated } = await monitorDependencies();
      return res.status(200).json({ dependencies, outdated });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/dependencies/conflicts', async (req, res) => {
    try {
      const { resolved, conflicts } = await resolveConflicts();
      return res.status(200).json({ resolved, conflicts });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/generate-egg', async (req, res) => {
    try {
      const eggOptions = req.body;
      const generatedEgg = await generateEgg(eggOptions);
      return res.status(200).json({ egg: generatedEgg });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/seedDatabase', async (req, res) => {
    try {
      const { data, model } = req.body;
      if (!data || !model) {
        return res.status(400).json({ error: 'Missing data or model' });
      }
      const result = await seed(data, model);
      return res
        .status(200)
        .json({ message: 'Database seeded successfully', ...result });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return app;
};

const startServer = async (preferredPort = process.env.PORT || 4003) => {
  const app = createApp();
  const port = await getPort({ port: preferredPort });
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${server.address().port}`);
      resolve({ app, server });
    });
  });
};

const stopServer = async (server) => {
  return new Promise((resolve) => {
    server.close(async () => {
      console.log('Server closed');
      await disconnect();
      resolve();
    });
  });
};

export default { createApp, startServer, stopServer };
