const mongoose = require('mongoose');
const { Schema } = mongoose;

const ruleSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  conditions: [
    {
      type: String,
      required: true,
    },
  ],
  actions: [
    {
      type: String,
      required: true,
    },
  ],
  priority: {
    type: Number,
    default: 1,
  },
  active: {
    type: Boolean,
    default: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  logs: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      action: String,
      result: String,
    },
  ],
  metadata: {
    type: Map,
    of: String,
  },
});


ruleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


ruleSchema.statics.evaluateConditions = function (conditions, data) {
  
  return conditions.every(condition => {
    try {
      // eslint-disable-next-line no-eval
      return eval(condition);
    } catch (error) {
      console.error(`Error evaluating condition: ${condition}`, error);
      return false;
    }
  });
};


ruleSchema.statics.executeActions = function (actions, data) {

  return actions.map(action => {
    console.log(`Executing action: ${action} with data:`, data);
    return `Executed: ${action}`;
  });
};


ruleSchema.methods.applyRule = async function (data) {
  if (!this.active) {
    console.log(`Rule ${this.name} is not active`);
    return null;
  }

  const conditionsMet = this.constructor.evaluateConditions(this.conditions, data);
  if (conditionsMet) {
    const results = this.constructor.executeActions(this.actions, data);
    this.logs.push({ action: 'applied', result: JSON.stringify(results) });
    await this.save();
    return results;
  } else {
    this.logs.push({ action: 'skipped', result: 'Conditions not met' });
    await this.save();
    return null;
  }
};

const Rule = mongoose.model('Rule', ruleSchema);

module.exports = Rule;
