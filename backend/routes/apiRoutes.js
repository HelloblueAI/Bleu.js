import express from 'express';
import multer from 'multer';
import Logger from '../utils/logger.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const upload = multer();
const logger = new Logger();

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
router.post('/data', 
  upload.none(), 
  body('data').notEmpty().withMessage('Data is required').isString().withMessage('Data must be a string'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed', { endpoint: '/data', errors: errors.array() });
      return res.status(400).json({ message: 'Bad Request', errors: errors.array() });
    }

    try {
      const { data } = req.body;

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

export default router;
