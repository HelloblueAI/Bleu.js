/* eslint-env node */
const express = require('express');

const router = express.Router();
const dataController = require('../controllers/dataController');

// POST request: Create or process data
router.post('/', dataController.handlePost);

// PUT request: Update existing data
router.put('/', dataController.handlePut);

// DELETE request: Remove data
router.delete('/', dataController.handleDelete);

// PATCH request: Partially update data
router.patch('/', dataController.handlePatch);

// HEAD request: Retrieve headers
router.head('/', dataController.handleHead);

// OPTIONS request: Provide allowed methods
router.options('/', dataController.handleOptions);

// GET requests for fetching data in different formats
router.get('/json', dataController.handleGetJson);
router.get('/html', dataController.handleGetHtml);
router.get('/', dataController.handleGet);

module.exports = router;
