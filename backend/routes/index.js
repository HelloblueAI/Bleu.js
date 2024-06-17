// backend/routes/index.js
const express = require('express');
const router = express.Router();
const apiRoutes = require('./apiRoutes');

router.use('/api', apiRoutes);

module.exports = router;
