import { Schema, model } from 'mongoose';

const ruleSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  data: {
    type: String,
    required: true
  },
  nested: {
    level1: {
      level2: {
        type: String,
        default: null
      },
    },
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Model
const Rule = model('Rule', ruleSchema);

// CRUD Operations
export const findAll = async () => {
  try {
    return await Rule.find({ isActive: true });
  } catch (error) {
    throw new Error(`Error fetching rules: ${error.message}`);
  }
};

export const findById = async (id) => {
  try {
    const rule = await Rule.findById(id);
    if (!rule) throw new Error('Rule not found');
    return rule;
  } catch (error) {
    throw new Error(`Error fetching rule: ${error.message}`);
  }
};

export const create = async (ruleData) => {
  try {
    const rule = new Rule(ruleData);
    return await rule.save();
  } catch (error) {
    throw new Error(`Error creating rule: ${error.message}`);
  }
};

export const update = async (id, ruleData) => {
  try {
    const rule = await Rule.findByIdAndUpdate(
      id,
      { ...ruleData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!rule) throw new Error('Rule not found');
    return rule;
  } catch (error) {
    throw new Error(`Error updating rule: ${error.message}`);
  }
};

export const remove = async (id) => {
  try {
    // Soft delete by updating isActive to false
    const rule = await Rule.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );
    if (!rule) throw new Error('Rule not found');
    return rule;
  } catch (error) {
    throw new Error(`Error deleting rule: ${error.message}`);
  }
};

// Additional utility functions
export const findByName = async (name) => {
  try {
    const rule = await Rule.findOne({ name, isActive: true });
    if (!rule) throw new Error('Rule not found');
    return rule;
  } catch (error) {
    throw new Error(`Error fetching rule by name: ${error.message}`);
  }
};

export const bulkCreate = async (rulesData) => {
  try {
    return await Rule.insertMany(rulesData);
  } catch (error) {
    throw new Error(`Error bulk creating rules: ${error.message}`);
  }
};

export default Rule;
