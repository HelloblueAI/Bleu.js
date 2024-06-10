const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');
const Rule = require('../models/ruleModel');
const { check, validationResult } = require('express-validator');

const aiService = new AIService();

const validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    console.log(`Request received at ${req.originalUrl} with data:`, req.body);
    next();
  };
};

router.post('/ai/rules', 
  validateRequest([
    check('data').exists().withMessage('Data is required')
  ]), 
  (req, res) => {
    const result = aiService.evaluateRules(req.body.data);
    res.status(200).json({ result });
});

router.post('/ai/decision', 
  validateRequest([
    check('data').exists().withMessage('Data is required')
  ]), 
  (req, res) => {
    const result = aiService.predictDecision(req.body.data);
    res.status(200).json({ result });
});

router.post('/ai/nlp', 
  validateRequest([
    check('text').exists().withMessage('Text is required')
  ]), 
  (req, res) => {
    const result = aiService.processText(req.body.text);
    res.status(200).json({ result });
});

router.post('/rules', 
  validateRequest([
    check('name').isString().withMessage('Name must be a string'),
    check('conditions').isArray().withMessage('Conditions must be an array of strings'),
    check('actions').isArray().withMessage('Actions must be an array of strings'),
    check('priority').optional().isInt().withMessage('Priority must be an integer')
  ]), 
  async (req, res) => {
    try {
      const rule = new Rule(req.body);
      await rule.save();
      res.status(201).json({ message: 'Rule created', rule });
    } catch (error) {
      console.error('Error creating rule:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/rules/:id', 
  validateRequest([
    check('name').optional().isString().withMessage('Name must be a string'),
    check('conditions').optional().isArray().withMessage('Conditions must be an array of strings'),
    check('actions').optional().isArray().withMessage('Actions must be an array of strings'),
    check('priority').optional().isInt().withMessage('Priority must be an integer')
  ]), 
  async (req, res) => {
    try {
      const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!rule) {
        return res.status(404).json({ message: 'Rule not found' });
      }
      res.status(200).json({ message: 'Rule updated', rule });
    } catch (error) {
      console.error('Error updating rule:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.delete('/rules/:id', async (req, res) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    res.status(200).json({ message: 'Rule deleted' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/rules', async (req, res) => {
  try {
    const rules = await Rule.find();
    res.status(200).json({ rules });
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/rules/:id', async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    res.status(200).json({ rule });
  } catch (error) {
    console.error('Error fetching rule:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/rules/:id/logs', async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    res.status(200).json({ logs: rule.logs });
  } catch (error) {
    console.error('Error fetching rule logs:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
