// backend/routes/simpleRoute.js
const express = require('express');
const router = express.Router();

router.get('/simple', (req, res) => {
  res.send('Hello from simple server!');
});

module.exports = router;
