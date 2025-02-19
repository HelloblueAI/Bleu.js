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
/* eslint-env node */
import { Router } from 'express';
import multer from 'multer';

import AIService from '../services/aiService';
import Logger from '../utils/logger';

const router = Router();
const upload = multer();
const logger = new Logger();
const aiService = new AIService();

router.post('/debug', (req, res) => {
  logger.info('Debug endpoint hit', { endpoint: '/debug' });
  res.send('Debugging');
});

router.post('/optimize', (req, res) => {
  logger.info('Optimize endpoint hit', { endpoint: '/optimize' });
  res.send('Optimizing');
});

router.post('/generate', (req, res) => {
  logger.info('Generate endpoint hit', { endpoint: '/generate' });
  res.send('Generating');
});

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
      logger.error('Internal Server Error: DB Test error', {
        endpoint: '/data',
      });
      return res.status(500).json({ message: 'Internal Server Error' });
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

router.get('/', (req, res) => {
  logger.info('Root endpoint hit', { endpoint: '/' });
  res.status(200).json({ message: 'Hello, World!' });
});

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

router.delete('/api/rules/:id', async (req, res) => {
  try {
    await aiService.removeRule(req.params.id);
    res.status(200).json({ message: 'Rule removed successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error removing rule', error: error.message });
  }
});

router.put('/api/rules/:id', async (req, res) => {
  try {
    await aiService.updateRule(req.params.id, req.body);
    res.status(200).json({ message: 'Rule updated successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error updating rule', error: error.message });
  }
});

router.post('/api/rules/evaluate', async (req, res) => {
  try {
    const result = await aiService.evaluateRules(req.body);
    res.status(200).json({ result });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error evaluating rules', error: error.message });
  }
});

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

router.post('/api/ai/process-text-advanced', async (req, res) => {
  try {
    const result = await aiService.processTextAdvanced(
      req.body.text,
      req.body.options,
    );
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({
      message: 'Error processing text with advanced options',
      error: error.message,
    });
  }
});

export default router;
