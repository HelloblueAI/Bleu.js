import express, { Express } from 'express';
import { createLogger } from './utils/logger';
import { Storage } from './utils/storage';
import { SelfLearningManager } from './core/selfLearningManager';

const logger = createLogger('App');
const app: Express = express();

// Initialize storage and self-learning system
const storage = new Storage();
const selfLearningManager = new SelfLearningManager(storage);

app.use(express.json());

// Initialize the application
async function initializeApp() {
  try {
    await storage.initialize();
    await selfLearningManager.initialize();
    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Add test endpoints
app.post('/api/tests/run', (req, res) => {
  res.json({ results: [] });
});

app.post('/api/tests/prioritize', (req, res) => {
  res.json({ prioritizedTests: [] });
});

// Add self-learning system endpoints
app.get('/api/learning/metrics', (req, res) => {
  res.json({ metrics: selfLearningManager.getMetrics() });
});

app.get('/api/learning/config', (req, res) => {
  res.json({ config: selfLearningManager.getConfig() });
});

app.get('/api/learning/status', (req, res) => {
  res.json({ active: selfLearningManager.isActive() });
});

// Cleanup on application shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal. Cleaning up...');
  await selfLearningManager.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal. Cleaning up...');
  await selfLearningManager.cleanup();
  process.exit(0);
});

// Start the application
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  initializeApp();
});

export default app; 