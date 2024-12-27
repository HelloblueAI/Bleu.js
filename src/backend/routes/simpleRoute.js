const express = require('express');

const apiRoutes = require('./apiRoutes');
const simpleRoute = require('./simpleRoute');

const router = express.Router();

// Mount API routes
router.use('/api', apiRoutes);

// Mount simple route
router.use('/simple', simpleRoute);

module.exports = router;
