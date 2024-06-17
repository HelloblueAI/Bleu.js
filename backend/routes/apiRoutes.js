const express = require('express');
const router = express.Router();
const Rule = require('../models/ruleModel');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

router.get('/rules', async (req, res) => {
  try {
    const rules = await Rule.find();
    res.status(200).json(rules);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/rules', async (req, res) => {
  try {
    const rule = new Rule(req.body);
    await rule.save();
    res.status(201).json({ message: 'Rule added successfully' });
  } catch (error) {
    logger.error(error);
    res.status(400).json({ message: error.message });
  }
});

router.delete('/rules/:id', async (req, res) => {
  try {
    await Rule.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Rule removed successfully' });
  } catch (error) {
    logger.error(error);
    res.status(400).json({ message: error.message });
  }
});

router.put('/rules/:id', async (req, res) => {
  try {
    await Rule.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json({ message: 'Rule updated successfully' });
  } catch (error) {
    logger.error(error);
    res.status(400).json({ message: error.message });
  }
});

router.post('/rules/evaluate', (req, res) => {
  
  res.status(200).json({ result: 'Evaluation result' });
});

router.all('/rules', (req, res) => {
  res.status(405).json({ message: 'Method Not Allowed' });
});

module.exports = router;
