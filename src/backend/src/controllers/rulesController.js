import { findAll, create, update, remove } from '../models/RuleModel.js';
import { validateRuleInput, trainModelLogic } from '../services/ruleService.js';

/**
 * Fetch all rules from the database
 */
export const getRules = async (req, res) => {
  try {
    const rules = await findAll();
    return res.status(200).json({ status: 200, data: rules });
  } catch (error) {
    console.error('Error fetching rules:', error.message);
    return res
      .status(500)
      .json({ status: 500, message: 'Internal Server Error' });
  }
};

/**
 * Add a new rule to the database
 */
export const addRule = async (req, res) => {
  try {
    const isValid = validateRuleInput(req.body);
    if (!isValid) {
      return res
        .status(400)
        .json({ status: 400, message: 'Invalid input data' });
    }

    const newRule = await create(req.body);
    return res.status(201).json({ status: 201, data: newRule });
  } catch (error) {
    console.error('Error adding rule:', error.message);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

/**
 * Update an existing rule by ID
 */
export const updateRule = async (req, res) => {
  try {
    const updatedRule = await update(req.params.id, req.body);
    if (!updatedRule) {
      return res.status(404).json({ status: 404, message: 'Rule not found' });
    }
    return res.status(200).json({ status: 200, data: updatedRule });
  } catch (error) {
    console.error('Error updating rule:', error.message);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

/**
 * Delete a rule by ID
 */
export const deleteRule = async (req, res) => {
  try {
    const deleted = await remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ status: 404, message: 'Rule not found' });
    }
    return res
      .status(200)
      .json({ status: 200, message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting rule:', error.message);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

/**
 * Monitor system dependencies
 */
export const monitorDependencies = async (req, res) => {
  try {
    const dependencies = ['MongoDB', 'Express', 'Node.js'];
    return res.status(200).json({ status: 200, data: dependencies });
  } catch (error) {
    console.error('Error monitoring dependencies:', error.message);
    return res
      .status(500)
      .json({ status: 500, message: 'Internal Server Error' });
  }
};

/**
 * Train a machine learning model
 */
export const trainModel = async (req, res) => {
  try {
    const { datasetId } = req.body;
    if (!datasetId) {
      return res
        .status(400)
        .json({ status: 400, message: 'Dataset ID is required' });
    }

    const modelId = await trainModelLogic(datasetId);
    return res.status(200).json({ status: 200, data: { modelId } });
  } catch (error) {
    console.error('Error training model:', error.message);
    return res.status(500).json({ status: 500, message: error.message });
  }
};
