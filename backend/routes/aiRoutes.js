const express = require('express');
const router = express.Router();
const Rule = require('../models/ruleModel');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const upload = multer();
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests, please try again later.',
});

router.use('/rules', limiter);

router.get('/rules', async (req, res) => {
  logger.info('GET /rules request received');
  try {
    const rules = await Rule.find();
    res.status(200).json(rules);
  } catch (error) {
    logger.error(`GET /rules failed: ${error.message}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/rules', upload.single('data'), async (req, res) => {
  logger.info('POST /rules request received');
  try {
    if (req.is('json')) {
      const { name, data } = req.body;
      const largePayloadLimit = 10000; // Define your payload size limit
      if (data && data.length > largePayloadLimit) {
        return res.status(413).json({ message: 'Payload Too Large' });
      }
      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }
      const rule = new Rule(req.body);
      await rule.save();
      res.status(201).json({ message: 'Rule added successfully' });
    } else if (req.file) {
      if (!req.body.name) {
        return res.status(400).json({ message: 'Name is required' });
      }
      res.status(201).json({ message: 'Data received' });
    } else {
      res.status(415).json({ message: 'Unsupported Media Type' });
    }
  } catch (error) {
    logger.error(`POST /rules failed: ${error.message}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.delete('/rules/:id', async (req, res) => {
  logger.info(`DELETE /rules/${req.params.id} request received`);
  try {
    await Rule.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Rule removed successfully' });
  } catch (error) {
    logger.error(`DELETE /rules/${req.params.id} failed: ${error.message}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/rules/:id', async (req, res) => {
  logger.info(`PUT /rules/${req.params.id} request received`);
  try {
    await Rule.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json({ message: 'Rule updated successfully' });
  } catch (error) {
    logger.error(`PUT /rules/${req.params.id} failed: ${error.message}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/rules/evaluate', (req, res) => {
  logger.info('POST /rules/evaluate request received');
  
  res.status(200).json({ result: 'Evaluation result' });
});

router.get('/rules/json', (req, res) => {
  logger.info('GET /rules/json request received');
  res.status(200).json({ message: 'JSON Data' });
});

router.get('/rules/html', (req, res) => {
  logger.info('GET /rules/html request received');
  res.status(200).send('<p>HTML Data</p>');
});

router.all('/api/rules', (req, res) => {
  logger.info('Invalid HTTP method received');
  res.status(405).json({ message: 'Method Not Allowed' });
});

module.exports = router;
