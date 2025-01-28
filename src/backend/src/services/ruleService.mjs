// src/backend/src/services/ruleService.mjs

/**
 * Validates the structure of a rule input
 * @param {Object} rule - The rule object to validate
 * @returns {boolean} - Whether the rule is valid
 */
export const validateRuleInput = (rule) => {
  if (!rule) return false;
  if (!rule.conditions || !rule.actions) return false;
  return Array.isArray(rule.conditions) && Array.isArray(rule.actions);
};

/**
 * Trains the model with the given dataset
 * @param {string} datasetId - ID of the dataset to train on
 * @returns {Promise<string>} - The ID of the trained model
 * @throws {Error} If datasetId is not provided
 */
export const trainModelLogic = async (datasetId) => {
  if (!datasetId) throw new Error('Dataset ID is required');

  // Simulated model training logic
  return `mock-model-${Date.now()}`;
};

// Optional: Add additional validation helpers
export const validateCondition = (condition) => {
  return condition && typeof condition === 'object' && 'type' in condition;
};

export const validateAction = (action) => {
  return action && typeof action === 'object' && 'type' in action;
};
