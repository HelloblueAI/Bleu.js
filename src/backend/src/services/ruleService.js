export const validateRuleInput = (rule) => {
  if (!rule.conditions || !rule.actions) return false;
  return Array.isArray(rule.conditions) && Array.isArray(rule.actions);
};

export const trainModelLogic = async (datasetId) => {
  if (!datasetId) throw new Error('Dataset ID is required');
  // Simulated model training logic
  return `mock-model-${Date.now()}`;
};
