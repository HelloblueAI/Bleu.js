const express = require('express');
const router = express.Router();

router.post('/data', (req, res) => {
  console.log('POST /data called');
  console.log('Received data:', req.body);
  res.status(201).send({ message: 'Data received' });
});

router.get('/rules', (req, res) => {
  res.status(200).send([]);
});

module.exports = router;
