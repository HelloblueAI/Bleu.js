'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.validateRuleInput =
  exports.validateCondition =
  exports.validateAction =
  exports.trainModelLogic =
    void 0;
var _isArray = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/array/is-array'),
);
var _now = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/date/now'),
);
// src/backend/src/services/ruleService.mjs

/**
 * Validates the structure of a rule input
 * @param {Object} rule - The rule object to validate
 * @returns {boolean} - Whether the rule is valid
 */
const validateRuleInput = (rule) => {
  if (!rule) return false;
  if (!rule.conditions || !rule.actions) return false;
  return (
    (0, _isArray.default)(rule.conditions) &&
    (0, _isArray.default)(rule.actions)
  );
};

/**
 * Trains the model with the given dataset
 * @param {string} datasetId - ID of the dataset to train on
 * @returns {Promise<string>} - The ID of the trained model
 * @throws {Error} If datasetId is not provided
 */
exports.validateRuleInput = validateRuleInput;
const trainModelLogic = async (datasetId) => {
  if (!datasetId) throw new Error('Dataset ID is required');

  // Simulated model training logic
  return `mock-model-${(0, _now.default)()}`;
};

// Optional: Add additional validation helpers
exports.trainModelLogic = trainModelLogic;
const validateCondition = (condition) => {
  return condition && typeof condition === 'object' && 'type' in condition;
};
exports.validateCondition = validateCondition;
const validateAction = (action) => {
  return action && typeof action === 'object' && 'type' in action;
};
exports.validateAction = validateAction;
