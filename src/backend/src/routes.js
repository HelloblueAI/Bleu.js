/* eslint-env node */
const express = require('express');
const multer = require('multer');

const AIService = require('../services/aiService');
const Logger = require('../utils/logger');

const router = express.Router();
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

module.exports = router;
