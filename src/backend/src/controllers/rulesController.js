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
import { findAll, create, update, remove } from '../models/ruleModel.mjs';
import { trainModelLogic } from '../services/ruleService.js';
import Joi from 'joi';

const ruleSchema = Joi.object({
  name: Joi.string().required(),
  condition: Joi.string().required(),
  action: Joi.string().required(),
});

/**
 * Fetch all rules from the database with pagination
 */
export const getRules = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const rules = await findAll()
      .skip((page - 1) * limit)
      .limit(limit);
    const totalRules = await findAll().countDocuments();

    return res.status(200).json({
      status: 200,
      data: rules,
      total: totalRules,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalRules / limit),
    });
  } catch (error) {
    console.error('Error fetching rules:', error.stack || error.message);
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
    const { error } = ruleSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ status: 400, message: error.details[0].message });
    }

    const newRule = await create(req.body);
    return res.status(201).json({ status: 201, data: newRule });
  } catch (error) {
    console.error('Error adding rule:', error.stack || error.message);
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
    console.error('Error updating rule:', error.stack || error.message);
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
    console.error('Error deleting rule:', error.stack || error.message);
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
    console.error(
      'Error monitoring dependencies:',
      error.stack || error.message,
    );
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
    console.error('Error training model:', error.stack || error.message);
    return res.status(500).json({ status: 500, message: error.message });
  }
};
