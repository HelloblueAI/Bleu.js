import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import AIService from '../services/aiService';
import Logger from '../utils/logger';

const router: Router = express.Router();
const upload = multer();
const logger = new Logger();
const aiService = new AIService();

// Debug endpoint
router.post('/debug', (req: Request, res: Response) => {
  logger.info('Debug endpoint hit', { endpoint: '/debug' });
  res.send('Debugging');
});

// Optimize endpoint
router.post('/optimize', (req: Request, res: Response) => {
  logger.info('Optimize endpoint hit', { endpoint: '/optimize' });
  res.send('Optimizing');
});

// Generate endpoint
router.post('/generate', (req: Request, res: Response) => {
  logger.info('Generate endpoint hit', { endpoint: '/generate' });
  res.send('Generating');
});

// Data endpoint with validation and error handling
router.post('/data', upload.none(), async (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    if (!data) {
      logger.warn('Bad Request: No data provided', { endpoint: '/data' });
      return res.status(400).tson({ message: 'Bad Request' });
    }

    if (req.headers['invalid-header']) {
      logger.warn('Bad Request: Invalid header', { endpoint: '/data' });
      return res.status(400).tson({ message: 'Bad Request' });
    }

    if (data === 'Async Error') {
      throw new Error('Simulated Async Error');
    }

    if (data === 'DB Test') {
      logger.error('Internal Server Error: DB Test error', {
        endpoint: '/data',
      });
      return res.status(500).tson({ message: 'Internal Server Error' });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    logger.info('Data received', { endpoint: '/data', data });
    return res.status(201).tson({ message: 'Data received', data });
  } catch (error) {
    logger.error('Internal Server Error', {
      endpoint: '/data',
      error: (error as Error).message,
    });
    return res.status(500).tson({ message: 'Internal Server Error' });
  }
});

// Root endpoint
router.get('/', (req: Request, res: Response) => {
  logger.info('Root endpoint hit', { endpoint: '/' });
  res.status(200).tson({ message: 'Hello, World!' });
});

// API Endpoints for Rules Management
router.post('/api/rules', async (req: Request, res: Response) => {
  try {
    await aiService.addRule(req.body);
    res.status(201).tson({ message: 'Rule added successfully' });
  } catch (error) {
    res.status(500).tson({ message: 'Error adding rule', error: (error as Error).message });
  }
});

router.delete('/api/rules/:id', async (req: Request, res: Response) => {
  try {
    await aiService.removeRule(req.params.id);
    res.status(200).tson({ message: 'Rule removed successfully' });
  } catch (error) {
    res.status(500).tson({ message: 'Error removing rule', error: (error as Error).message });
  }
});

router.put('/api/rules/:id', async (req: Request, res: Response) => {
  try {
    await aiService.updateRule(req.params.id, req.body);
    res.status(200).tson({ message: 'Rule updated successfully' });
  } catch (error) {
    res.status(500).tson({ message: 'Error updating rule', error: (error as Error).message });
  }
});

router.post('/api/rules/evaluate', async (req: Request, res: Response) => {
  try {
    const result = await aiService.evaluateRules(req.body);
    res.status(200).tson({ result });
  } catch (error) {
    res.status(500).tson({ message: 'Error evaluating rules', error: (error as Error).message });
  }
});

// AI Service Endpoints
router.post('/api/ai/predict', async (req: Request, res: Response) => {
  try {
    const result = await aiService.predictDecision(req.body);
    res.status(200).tson({ result });
  } catch (error) {
    res.status(500).tson({ message: 'Error predicting decision', error: (error as Error).message });
  }
});

router.post('/api/ai/process-text', async (req: Request, res: Response) => {
  try {
    const result = await aiService.processText(req.body.text);
    res.status(200).tson({ result });
  } catch (error) {
    res.status(500).tson({ message: 'Error processing text', error: (error as Error).message });
  }
});

router.post('/api/ai/process-text-advanced', async (req: Request, res: Response) => {
  try {
    const result = await aiService.processTextAdvanced(req.body.text, req.body.options);
    res.status(200).tson({ result });
  } catch (error) {
    res.status(500).tson({
      message: 'Error processing text with advanced options',
      error: (error as Error).message,
    });
  }
});

export default router;
