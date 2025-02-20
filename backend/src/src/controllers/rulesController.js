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
const Joi = require('joi');
const ruleModel = require('../models/RuleModel');
const ruleService = require('../services/ruleService');

/**
 * Schema for rule validation
 */
const ruleSchema = Joi.object({
  name: Joi.string().required(),
  condition: Joi.string().required(),
  action: Joi.string().required(),
});

/**
 * Fetch all rules with pagination
 */
const getRules = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const rules = await ruleModel
      .findAll()
      .skip((page - 1) * limit)
      .limit(limit);
    const totalRules = await ruleModel.findAll().countDocuments();

    return res.status(200).json({
      status: 200,
      data: rules,
      total: totalRules,
      page,
      totalPages: Math.ceil(totalRules / limit),
    });
  } catch (error) {
    logger.error(`❌ Error fetching rules: ${error.message}`);
    return res
      .status(500)
      .json({ status: 500, message: 'Internal Server Error' });
  }
};

/**
 * Add a new rule
 */
const addRule = async (req, res) => {
  try {
    const { error } = ruleSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ status: 400, message: error.details[0].message });
    }

    const newRule = await ruleModel.create(req.body);
    return res.status(201).json({ status: 201, data: newRule });
  } catch (error) {
    logger.error(`❌ Error adding rule: ${error.message}`);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

/**
 * Update an existing rule
 */
const updateRule = async (req, res) => {
  try {
    const updatedRule = await ruleModel.update(req.params.id, req.body);
    if (!updatedRule) {
      return res.status(404).json({ status: 404, message: 'Rule not found' });
    }
    return res.status(200).json({ status: 200, data: updatedRule });
  } catch (error) {
    logger.error(`❌ Error updating rule: ${error.message}`);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

/**
 * Delete a rule by ID
 */
const deleteRule = async (req, res) => {
  try {
    const deleted = await ruleModel.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ status: 404, message: 'Rule not found' });
    }
    return res
      .status(200)
      .json({ status: 200, message: 'Rule deleted successfully' });
  } catch (error) {
    logger.error(`❌ Error deleting rule: ${error.message}`);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

/**
 * Monitor system dependencies
 */
const monitorDependencies = async (req, res) => {
  try {
    const dependencies = ['MongoDB', 'Express', 'Node.js'];
    return res.status(200).json({ status: 200, data: dependencies });
  } catch (error) {
    logger.error(`❌ Error monitoring dependencies: ${error.message}`);
    return res
      .status(500)
      .json({ status: 500, message: 'Internal Server Error' });
  }
};

/**
 * Train a machine learning model
 */
const trainModel = async (req, res) => {
  try {
    const { datasetId } = req.body;
    if (!datasetId) {
      return res
        .status(400)
        .json({ status: 400, message: 'Dataset ID is required' });
    }

    const modelId = await ruleService.trainModelLogic(datasetId);
    return res.status(200).json({ status: 200, data: { modelId } });
  } catch (error) {
    logger.error(`❌ Error training model: ${error.message}`);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

module.exports = {
  getRules,
  addRule,
  updateRule,
  deleteRule,
  monitorDependencies,
  trainModel,
};
