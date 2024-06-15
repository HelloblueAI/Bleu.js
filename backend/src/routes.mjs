import express from 'express';
import multer from 'multer';
import Logger from '../utils/logger.mjs';
import AIService from '../services/aiService.mjs';

const router = express.Router();
const upload = multer();
const logger = new Logger();
const aiService = new AIService();

/**
 * @swagger
 * tags:
 *   - name: Debug
 *     description: Debugging operations
 *   - name: Optimization
 *     description: Optimization operations
 *   - name: Generation
 *     description: Generation operations
 *   - name: Data
 *     description: Data handling operations
 *   - name: AI
 *     description: AI operations
 *   - name: Root
 *     description: Root endpoint
 */

/**
 * @swagger
 * /debug:
 *   post:
 *     summary: Debug logic
 *     tags: [Debug]
 *     responses:
 *       200:
 *         description: Debugging
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: Debugging
 */
router.post('/debug', (req, res) => {
  logger.info('Debug endpoint hit', { endpoint: '/debug' });
  res.send('Debugging');
});

/**
 * @swagger
 * /optimize:
 *   post:
 *     summary: Optimize logic
 *     tags: [Optimization]
 *     responses:
 *       200:
 *         description: Optimizing
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: Optimizing
 */
router.post('/optimize', (req, res) => {
  logger.info('Optimize endpoint hit', { endpoint: '/optimize' });
  res.send('Optimizing');
});

/**
 * @swagger
 * /generate:
 *   post:
 *     summary: Generate logic
 *     tags: [Generation]
 *     responses:
 *       200:
 *         description: Generating
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: Generating
 */
router.post('/generate', (req, res) => {
  logger.info('Generate endpoint hit', { endpoint: '/generate' });
  res.send('Generating');
});

/**
 * @swagger
 * /data:
 *   post:
 *     summary: Handle data
 *     tags: [Data]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: string
 *     responses:
 *       201:
 *         description: Data received
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data received
 *                 data:
 *                   type: string
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */
router.post('/data', upload.none(), async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      logger.warn('Bad Request: No data provided', { endpoint: '/data' });
      return res.status(400).json({ message: 'Bad Request' });
    }

    if (req.headers['invalid-header']) {
      logger.warn('Bad Request: Invalid header', { endpoint: '/data' });
      return res.status(400).json({ message: 'Bad Request' });
    }

    if (data === 'Async Error') {
      throw new Error('Simulated Async Error');
    }

    if (data === 'DB Test') {
      logger.error('Internal Server Error: DB Test error', { endpoint: '/data' });
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    logger.info('Data received', { endpoint: '/data', data });
    res.status(201).json({ message: 'Data received', data });
  } catch (error) {
    logger.error('Internal Server Error', { endpoint: '/data', error: error.message });
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get welcome message
 *     tags: [Root]
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello, World!
 */
router.get('/', (req, res) => {
  logger.info('Root endpoint hit', { endpoint: '/' });
  res.status(200).json({ message: 'Hello, World!' });
});

/**
 * @swagger
 * /api/rules:
 *   post:
 *     summary: Add a new rule
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: string
 *               actions:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: number
 *     responses:
 *       201:
 *         description: Rule added successfully
 *       500:
 *         description: Error adding rule
 */
router.post('/api/rules', async (req, res) => {
  try {
    await aiService.addRule(req.body);
    res.status(201).json({ message: 'Rule added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding rule', error: error.message });
  }
});

/**
 * @swagger
 * /api/rules/{id}:
 *   delete:
 *     summary: Remove a rule
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The rule ID
 *     responses:
 *       200:
 *         description: Rule removed successfully
 *       500:
 *         description: Error removing rule
 */
router.delete('/api/rules/:id', async (req, res) => {
  try {
    await aiService.removeRule(req.params.id);
    res.status(200).json({ message: 'Rule removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing rule', error: error.message });
  }
});

/**
 * @swagger
 * /api/rules/{id}:
 *   put:
 *     summary: Update a rule
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The rule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: string
 *               actions:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: number
 *     responses:
 *       200:
 *         description: Rule updated successfully
 *       500:
 *         description: Error updating rule
 */
router.put('/api/rules/:id', async (req, res) => {
  try {
    await aiService.updateRule(req.params.id, req.body);
    res.status(200).json({ message: 'Rule updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating rule', error: error.message });
  }
});

/**
 * @swagger
 * /api/rules/evaluate:
 *   post:
 *     summary: Evaluate rules
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Rules evaluated successfully
 *       500:
 *         description: Error evaluating rules
 */
router.post('/api/rules/evaluate', async (req, res) => {
  try {
    const result = await aiService.evaluateRules(req.body);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: 'Error evaluating rules', error: error.message });
  }
});

/**
 * @swagger
 * /api/ai/predict:
 *   post:
 *     summary: Predict decision
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Decision predicted successfully
 *       500:
 *         description: Error predicting decision
 */
router.post('/api/ai/predict', async (req, res) => {
  try {
    const result = await aiService.predictDecision(req.body);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: 'Error predicting decision', error: error.message });
  }
});

/**
 * @swagger
 * /api/ai/process-text:
 *   post:
 *     summary: Process text
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Text processed successfully
 *       500:
 *         description: Error processing text
 */
router.post('/api/ai/process-text', async (req, res) => {
  try {
    const result = await aiService.processText(req.body.text);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: 'Error processing text', error: error.message });
  }
});

/**
 * @swagger
 * /api/ai/process-text-advanced:
 *   post:
 *     summary: Process text with advanced options
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Text processed with advanced options successfully
 *       500:
 *         description: Error processing text with advanced options
 */
router.post('/api/ai/process-text-advanced', async (req, res) => {
  try {
    const result = await aiService.processTextAdvanced(req.body.text, req.body.options);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: 'Error processing text with advanced options', error: error.message });
  }
});

export default router;
