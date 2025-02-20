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
const mongoose = require('mongoose');
const logger = require('../src/utils/logger');

/**
 * Schema for storing AI queries and responses.
 */
const AiQuerySchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: [true, 'Query text is required.'],
      trim: true,
      index: true, // Improves search performance
    },
    response: {
      type: String,
      required: [true, 'Response text is required.'],
      trim: true,
    },
    modelUsed: {
      type: String,
      required: [true, 'Model name is required.'],
      trim: true,
    },
    confidence: {
      type: Number,
      default: 0.95,
      min: [0, 'Confidence must be at least 0.0'],
      max: [1, 'Confidence must not exceed 1.0'],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt & updatedAt
  },
);

// Indexing for optimized search
AiQuerySchema.index({ query: 1, createdAt: -1 });

/**
 * Middleware for logging saved queries.
 */
AiQuerySchema.post('save', function (doc) {
  logger.info(`✅ AI Query saved: ${doc.query}`);
});

const AiQuery = mongoose.model('AiQuery', AiQuerySchema);

module.exports = AiQuery;
