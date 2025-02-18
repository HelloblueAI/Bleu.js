'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.update =
  exports.remove =
  exports.findByName =
  exports.findById =
  exports.findAll =
  exports.default =
  exports.create =
  exports.bulkCreate =
    void 0;
var _find = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/find'),
);
var _now = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/date/now'),
);
var _mongoose = require('mongoose');
const ruleSchema = new _mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    data: {
      type: String,
      required: true,
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
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  },
);

// Model
const Rule = (0, _mongoose.model)('Rule', ruleSchema);

// CRUD Operations
const findAll = async () => {
  try {
    return await (0, _find.default)(Rule).call(Rule, {
      isActive: true,
    });
  } catch (error) {
    throw new Error(`Error fetching rules: ${error.message}`);
  }
};
exports.findAll = findAll;
const findById = async (id) => {
  try {
    const rule = await Rule.findById(id);
    if (!rule) throw new Error('Rule not found');
    return rule;
  } catch (error) {
    throw new Error(`Error fetching rule: ${error.message}`);
  }
};
exports.findById = findById;
const create = async (ruleData) => {
  try {
    const rule = new Rule(ruleData);
    return await rule.save();
  } catch (error) {
    throw new Error(`Error creating rule: ${error.message}`);
  }
};
exports.create = create;
const update = async (id, ruleData) => {
  try {
    const rule = await Rule.findByIdAndUpdate(
      id,
      {
        ...ruleData,
        updatedAt: (0, _now.default)(),
      },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!rule) throw new Error('Rule not found');
    return rule;
  } catch (error) {
    throw new Error(`Error updating rule: ${error.message}`);
  }
};
exports.update = update;
const remove = async (id) => {
  try {
    // Soft delete by updating isActive to false
    const rule = await Rule.findByIdAndUpdate(
      id,
      {
        isActive: false,
        updatedAt: (0, _now.default)(),
      },
      {
        new: true,
      },
    );
    if (!rule) throw new Error('Rule not found');
    return rule;
  } catch (error) {
    throw new Error(`Error deleting rule: ${error.message}`);
  }
};

// Additional utility functions
exports.remove = remove;
const findByName = async (name) => {
  try {
    const rule = await Rule.findOne({
      name,
      isActive: true,
    });
    if (!rule) throw new Error('Rule not found');
    return rule;
  } catch (error) {
    throw new Error(`Error fetching rule by name: ${error.message}`);
  }
};
exports.findByName = findByName;
const bulkCreate = async (rulesData) => {
  try {
    return await Rule.insertMany(rulesData);
  } catch (error) {
    throw new Error(`Error bulk creating rules: ${error.message}`);
  }
};
exports.bulkCreate = bulkCreate;
var _default = (exports.default = Rule);
