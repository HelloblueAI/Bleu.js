'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.updateRule =
  exports.trainModel =
  exports.monitorDependencies =
  exports.getRules =
  exports.deleteRule =
  exports.addRule =
    void 0;
var _parseInt2 = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/parse-int'),
);
var _ruleModel = require('../models/ruleModel.mjs');
var _ruleService = require('../services/ruleService.mjs');
var _joi = _interopRequireDefault(require('joi'));
// Import Joi for validation

// Schema for rule validation
const ruleSchema = _joi.default.object({
  name: _joi.default.string().required(),
  condition: _joi.default.string().required(),
  action: _joi.default.string().required(),
});

/**
 * Fetch all rules from the database with pagination
 */
const getRules = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const rules = await (0, _ruleModel.findAll)()
      .skip((page - 1) * limit)
      .limit(limit);
    const totalRules = await (0, _ruleModel.findAll)().countDocuments();
    return res.status(200).json({
      status: 200,
      data: rules,
      total: totalRules,
      page: (0, _parseInt2.default)(page, 10),
      totalPages: Math.ceil(totalRules / limit),
    });
  } catch (error) {
    console.error('Error fetching rules:', error.stack || error.message);
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
    });
  }
};

/**
 * Add a new rule to the database
 */
exports.getRules = getRules;
const addRule = async (req, res) => {
  try {
    const { error } = ruleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 400,
        message: error.details[0].message,
      });
    }
    const newRule = await (0, _ruleModel.create)(req.body);
    return res.status(201).json({
      status: 201,
      data: newRule,
    });
  } catch (error) {
    console.error('Error adding rule:', error.stack || error.message);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

/**
 * Update an existing rule by ID
 */
exports.addRule = addRule;
const updateRule = async (req, res) => {
  try {
    const updatedRule = await (0, _ruleModel.update)(req.params.id, req.body);
    if (!updatedRule) {
      return res.status(404).json({
        status: 404,
        message: 'Rule not found',
      });
    }
    return res.status(200).json({
      status: 200,
      data: updatedRule,
    });
  } catch (error) {
    console.error('Error updating rule:', error.stack || error.message);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

/**
 * Delete a rule by ID
 */
exports.updateRule = updateRule;
const deleteRule = async (req, res) => {
  try {
    const deleted = await (0, _ruleModel.remove)(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        status: 404,
        message: 'Rule not found',
      });
    }
    return res.status(200).json({
      status: 200,
      message: 'Rule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting rule:', error.stack || error.message);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

/**
 * Monitor system dependencies
 */
exports.deleteRule = deleteRule;
const monitorDependencies = async (req, res) => {
  try {
    const dependencies = ['MongoDB', 'Express', 'Node.js'];
    return res.status(200).json({
      status: 200,
      data: dependencies,
    });
  } catch (error) {
    console.error(
      'Error monitoring dependencies:',
      error.stack || error.message,
    );
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
    });
  }
};

/**
 * Train a machine learning model
 */
exports.monitorDependencies = monitorDependencies;
const trainModel = async (req, res) => {
  try {
    const { datasetId } = req.body;
    if (!datasetId) {
      return res.status(400).json({
        status: 400,
        message: 'Dataset ID is required',
      });
    }
    const modelId = await (0, _ruleService.trainModelLogic)(datasetId);
    return res.status(200).json({
      status: 200,
      data: {
        modelId,
      },
    });
  } catch (error) {
    console.error('Error training model:', error.stack || error.message);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
exports.trainModel = trainModel;
