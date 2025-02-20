//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

'use strict';
/* eslint-env node */
const logger = require('../src/utils/logger');

/**
 * Handles POST requests with specific routes.
 */
function handlePost(req, res) {
  try {
    const { url, body } = req;

    if (url.includes('predict')) {
      if (!body.input) {
        return res.status(400).json({ error: 'Invalid input data' });
      }
      logger.info('✅ Prediction request received.');
      return res.status(200).json({ prediction: 'Predicted result' });
    }

    if (url.includes('processData')) {
      logger.info('📊 Data processed and stored.');
      return res.status(201).json({ message: 'Data processed successfully' });
    }

    if (url.includes('trainModel')) {
      logger.info('🚀 Model training started.');
      return res.status(202).json({ message: 'Model training started' });
    }

    if (url.includes('uploadDataset')) {
      logger.warn('⚠️ Dataset upload payload too large.');
      return res.status(413).json({ error: 'Payload Too Large' });
    }

    logger.info('📨 Generic data received.');
    return res.status(201).json({ message: 'Data received' });
  } catch (error) {
    logger.error(`❌ Error handling POST request: ${error.message}`);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Handles PUT requests.
 */
function handlePut(req, res) {
  logger.info('🔄 Data updated successfully.');
  res.status(200).json({ message: 'Data updated' });
}

/**
 * Handles DELETE requests.
 */
function handleDelete(req, res) {
  logger.info('🗑️ Data deleted successfully.');
  res.status(200).json({ message: 'Data deleted' });
}

/**
 * Handles PATCH requests.
 */
function handlePatch(req, res) {
  logger.info('🔧 Data patched successfully.');
  res.status(200).json({ message: 'Data patched' });
}

/**
 * Handles HEAD requests.
 */
function handleHead(req, res) {
  res.status(200).end();
}

/**
 * Handles OPTIONS requests.
 */
function handleOptions(req, res) {
  res
    .status(204)
    .setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    )
    .end();
}

/**
 * Handles GET requests.
 */
function handleGet(req, res) {
  try {
    const { url } = req;

    if (url.includes('processedData')) {
      logger.info('📊 Fetching processed data.');
      return res.status(200).json({ data: [] });
    }

    if (url.includes('trainModel/status')) {
      logger.info('⏳ Fetching model training status.');
      return res.status(200).json({ status: 'in progress' });
    }

    logger.info('📥 Data fetched successfully.');
    return res.status(200).json({ message: 'Data fetched' });
  } catch (error) {
    logger.error(`❌ Error handling GET request: ${error.message}`);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Handles JSON data responses.
 */
function handleGetJson(req, res) {
  logger.info('📄 JSON data fetched.');
  res.status(200).json({ message: 'JSON Data' });
}

/**
 * Handles HTML data responses.
 */
function handleGetHtml(req, res) {
  logger.info('📄 HTML data fetched.');
  res.status(200).send('<html><body>HTML Data</body></html>');
}

// Export all handlers
module.exports = {
  handlePost,
  handlePut,
  handleDelete,
  handlePatch,
  handleHead,
  handleOptions,
  handleGet,
  handleGetJson,
  handleGetHtml,
};
