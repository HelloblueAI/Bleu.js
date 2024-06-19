const express = require('express');
const router = express.Router();

router.get('/rules', (req, res) => {
  // Replace with actual rules retrieval logic
  res.status(200).json([]);
});

router.post('/data', (req, res) => {
  console.log('POST /data called');
  console.log('Received data:', req.body);
  res.status(201).send({ message: 'Data received' });
});

module.exports = router;
