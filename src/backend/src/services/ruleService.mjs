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
import logger from '../utils/logger.mjs';

/**
 * Validates the structure of a rule input.
 * @param {Object} rule - The rule object to validate.
 * @returns {boolean} - Whether the rule is valid.
 */
export const validateRuleInput = (rule) => {
  if (!rule) {
    logger.warn('⚠️ Rule validation failed: Rule object is missing.');
    return false;
  }

  if (!Array.isArray(rule.conditions) || !Array.isArray(rule.actions)) {
    logger.warn('⚠️ Rule validation failed: Invalid conditions or actions.');
    return false;
  }

  logger.info('✅ Rule input validation passed.');
  return true;
};

/**
 * Validates a condition object.
 * @param {Object} condition - The condition object.
 * @returns {boolean} - Whether the condition is valid.
 */
export const validateCondition = (condition) => {
  const isValid =
    condition && typeof condition === 'object' && 'type' in condition;

  if (!isValid) {
    logger.warn('⚠️ Invalid condition:', condition);
  }

  return isValid;
};

/**
 * Validates an action object.
 * @param {Object} action - The action object.
 * @returns {boolean} - Whether the action is valid.
 */
export const validateAction = (action) => {
  const isValid = action && typeof action === 'object' && 'type' in action;

  if (!isValid) {
    logger.warn('⚠️ Invalid action:', action);
  }

  return isValid;
};

/**
 * Trains the model with the given dataset.
 * @param {string} datasetId - ID of the dataset to train on.
 * @returns {Promise<string>} - The ID of the trained model.
 * @throws {Error} If datasetId is not provided.
 */
export const trainModelLogic = async (datasetId) => {
  if (!datasetId) {
    logger.error('❌ Training failed: Dataset ID is required.');
    throw new Error('Dataset ID is required');
  }

  logger.info(`🚀 Training model on dataset: ${datasetId}`);

  // Simulated model training logic
  const modelId = `mock-model-${Date.now()}`;

  logger.info(`✅ Model training completed. Model ID: ${modelId}`);
  return modelId;
};
