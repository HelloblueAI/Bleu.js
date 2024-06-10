const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');

const aiService = new AIService();

aiService.addRule({
  condition: (data) => data.type === 'greeting',
  action: (data) => `Hello, ${data.name || 'stranger'}!`
});

aiService.addRule({
  condition: (data) => data.type === 'farewell',
  action: (data) => `Goodbye, ${data.name || 'stranger'}!`
});

router.post('/ai/rules', (req, res) => {
  const result = aiService.evaluate(req.body);
  res.status(200).json({ result });
});

module.exports = router;
