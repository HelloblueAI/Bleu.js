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
 * Validates the structure of a rule input.
 * @param {Object} rule - The rule object to validate.
 * @returns {boolean} - Whether the rule is valid.
 */
const validateRuleInput = (rule) => {
  if (!rule || typeof rule !== 'object') {
    logger.warn('⚠️ Invalid rule input: Rule must be an object.');
    return false;
  }

  if (!Array.isArray(rule.conditions) || !Array.isArray(rule.actions)) {
    logger.warn(
      '⚠️ Invalid rule structure: Conditions and actions must be arrays.',
    );
    return false;
  }

  return true;
};

/**
 * Validates a condition object.
 * @param {Object} condition - The condition to validate.
 * @returns {boolean} - Whether the condition is valid.
 */
const validateCondition = (condition) => {
  const isValid =
    condition && typeof condition === 'object' && 'type' in condition;
  if (!isValid) logger.warn('⚠️ Invalid condition format:', condition);
  return isValid;
};

/**
 * Validates an action object.
 * @param {Object} action - The action to validate.
 * @returns {boolean} - Whether the action is valid.
 */
const validateAction = (action) => {
  const isValid = action && typeof action === 'object' && 'type' in action;
  if (!isValid) logger.warn('⚠️ Invalid action format:', action);
  return isValid;
};

/**
 * Trains the model with the given dataset.
 * @param {string} datasetId - ID of the dataset to train on.
 * @returns {Promise<string>} - The ID of the trained model.
 * @throws {Error} If datasetId is not provided or training fails.
 */
const trainModelLogic = async (datasetId) => {
  if (!datasetId) {
    logger.error('❌ Dataset ID is required for model training.');
    throw new Error('Dataset ID is required');
  }

  try {
    logger.info(`🚀 Training model with dataset: ${datasetId}`);

    // Simulated model training logic
    const modelId = `mock-model-${Date.now()}`;

    logger.info(
      `✅ Model training completed successfully. Model ID: ${modelId}`,
    );
    return modelId;
  } catch (error) {
    logger.error(`❌ Model training failed: ${error.message}`);
    throw error;
  }
};

// Export functions
module.exports = {
  validateRuleInput,
  validateCondition,
  validateAction,
  trainModelLogic,
};
