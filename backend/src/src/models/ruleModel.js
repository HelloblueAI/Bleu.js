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
 * Rule Schema
 */
const ruleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Rule name is required.'],
      trim: true,
      unique: true,
      index: true, // Improves search performance
    },
    description: {
      type: String,
      trim: true,
    },
    data: {
      type: String,
      required: [true, 'Rule data is required.'],
    },
    nested: {
      level1: {
        level2: {
          type: String,
          default: null,
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: [true, 'Created by field is required.'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  },
);

/**
 * Indexing for optimized search queries
 */
ruleSchema.index({ name: 1, createdAt: -1 });

/**
 * Mongoose Model
 */
const Rule = mongoose.model('Rule', ruleSchema);

/**
 * Retrieves all active rules.
 * @returns {Promise<Array>} List of active rules.
 */
const findAll = async () => {
  try {
    return await Rule.find({ isActive: true });
  } catch (error) {
    logger.error(`❌ Error fetching rules: ${error.message}`);
    throw new Error(`Error fetching rules: ${error.message}`);
  }
};

/**
 * Retrieves a rule by ID.
 * @param {string} id - Rule ID.
 * @returns {Promise<Object>} Rule object.
 */
const findById = async (id) => {
  try {
    const rule = await Rule.findById(id);
    if (!rule) throw new Error('Rule not found');
    return rule;
  } catch (error) {
    logger.error(`❌ Error fetching rule: ${error.message}`);
    throw new Error(`Error fetching rule: ${error.message}`);
  }
};

/**
 * Retrieves a rule by name.
 * @param {string} name - Rule name.
 * @returns {Promise<Object>} Rule object.
 */
const findByName = async (name) => {
  try {
    const rule = await Rule.findOne({ name, isActive: true });
    if (!rule) throw new Error('Rule not found');
    return rule;
  } catch (error) {
    logger.error(`❌ Error fetching rule by name: ${error.message}`);
    throw new Error(`Error fetching rule by name: ${error.message}`);
  }
};

/**
 * Creates a new rule.
 * @param {Object} ruleData - Rule object.
 * @returns {Promise<Object>} Created rule object.
 */
const create = async (ruleData) => {
  try {
    const rule = new Rule(ruleData);
    await rule.save();
    logger.info(`✅ Rule created: ${rule.name}`);
    return rule;
  } catch (error) {
    logger.error(`❌ Error creating rule: ${error.message}`);
    throw new Error(`Error creating rule: ${error.message}`);
  }
};

/**
 * Bulk creates rules.
 * @param {Array} rulesData - Array of rule objects.
 * @returns {Promise<Array>} Created rules.
 */
const bulkCreate = async (rulesData) => {
  try {
    return await Rule.insertMany(rulesData);
  } catch (error) {
    logger.error(`❌ Error bulk creating rules: ${error.message}`);
    throw new Error(`Error bulk creating rules: ${error.message}`);
  }
};

/**
 * Updates an existing rule by ID.
 * @param {string} id - Rule ID.
 * @param {Object} ruleData - Rule update data.
 * @returns {Promise<Object>} Updated rule.
 */
const update = async (id, ruleData) => {
  try {
    const rule = await Rule.findByIdAndUpdate(
      id,
      {
        ...ruleData,
        updatedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!rule) throw new Error('Rule not found');
    logger.info(`🔄 Rule updated: ${rule.name}`);
    return rule;
  } catch (error) {
    logger.error(`❌ Error updating rule: ${error.message}`);
    throw new Error(`Error updating rule: ${error.message}`);
  }
};

/**
 * Soft deletes a rule by setting `isActive` to false.
 * @param {string} id - Rule ID.
 * @returns {Promise<Object>} Updated rule (soft-deleted).
 */
const remove = async (id) => {
  try {
    const rule = await Rule.findByIdAndUpdate(
      id,
      {
        isActive: false,
        updatedAt: Date.now(),
      },
      {
        new: true,
      },
    );
    if (!rule) throw new Error('Rule not found');
    logger.info(`🗑️ Rule soft deleted: ${rule.name}`);
    return rule;
  } catch (error) {
    logger.error(`❌ Error deleting rule: ${error.message}`);
    throw new Error(`Error deleting rule: ${error.message}`);
  }
};

// Export all CRUD functions and model
module.exports = {
  Rule,
  findAll,
  findById,
  findByName,
  create,
  bulkCreate,
  update,
  remove,
};
