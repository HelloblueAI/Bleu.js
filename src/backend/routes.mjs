//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

import { Router } from 'express';
import multer from 'multer';
import AIService from '../services/aiService.mjs';
import Logger from '../utils/logger.mjs';

const router = Router();
const upload = multer();
const logger = new Logger();
const aiService = new AIService();

/**
 * @swagger
 * /debug:
 *   post:
 *     summary: Debug API
 *     description: Returns a debug message.
 *     responses:
 *       200:
 *         description: Debugging message.
 */
router.post('/debug', (req, res) => {
  logger.info('Debug endpoint hit', { endpoint: '/debug' });
  res.send('Debugging');
});

/**
 * @swagger
 * /optimize:
 *   post:
 *     summary: Optimize API
 *     description: Returns an optimization message.
 *     responses:
 *       200:
 *         description: Optimizing message.
 */
router.post('/optimize', (req, res) => {
  logger.info('Optimize endpoint hit', { endpoint: '/optimize' });
  res.send('Optimizing');
});

/**
 * @swagger
 * /generate:
 *   post:
 *     summary: Generate API
 *     description: Returns a generation message.
 *     responses:
 *       200:
 *         description: Generating message.
 */
router.post('/generate', (req, res) => {
  logger.info('Generate endpoint hit', { endpoint: '/generate' });
  res.send('Generating');
});

/**
 * @swagger
 * /data:
 *   post:
 *     summary: Submit Data
 *     description: Receives data and processes it.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: string
 *                 example: "Sample data"
 *     responses:
 *       201:
 *         description: Data received successfully.
 *       400:
 *         description: Bad Request.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/data', upload.none(), async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      logger.warn('Bad Request: No data provided', { endpoint: '/data' });
      return res.status(400).json({ message: 'Bad Request' });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    logger.info('Data received', { endpoint: '/data', data });
    return res.status(201).json({ message: 'Data received', data });
  } catch (error) {
    logger.error('Internal Server Error', {
      endpoint: '/data',
      error: error.message,
    });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root API
 *     description: Root endpoint for health check.
 *     responses:
 *       200:
 *         description: API is running.
 */
router.get('/', (req, res) => {
  logger.info('Root endpoint hit', { endpoint: '/' });
  res.status(200).json({ message: 'Hello, World!' });
});

/**
 * @swagger
 * /api/rules:
 *   post:
 *     summary: Add Rule
 *     description: Adds a new AI rule.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Rule added successfully.
 *       500:
 *         description: Error adding rule.
 */
router.post('/api/rules', async (req, res) => {
  try {
    await aiService.addRule(req.body);
    res.status(201).json({ message: 'Rule added successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error adding rule', error: error.message });
  }
});

/**
 * @swagger
 * /api/ai/predict:
 *   post:
 *     summary: AI Prediction
 *     description: Runs AI prediction on the given input.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Returns AI prediction.
 *       500:
 *         description: Error predicting.
 */
router.post('/api/ai/predict', async (req, res) => {
  try {
    const result = await aiService.predictDecision(req.body);
    res.status(200).json({ result });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error predicting decision', error: error.message });
  }
});

/**
 * @swagger
 * /api/ai/process-text:
 *   post:
 *     summary: Process Text
 *     description: Processes text using AI.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Analyze this text"
 *     responses:
 *       200:
 *         description: Returns processed text result.
 *       500:
 *         description: Error processing text.
 */
router.post('/api/ai/process-text', async (req, res) => {
  try {
    const result = await aiService.processText(req.body.text);
    res.status(200).json({ result });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error processing text', error: error.message });
  }
});

export default router;
