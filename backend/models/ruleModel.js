const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  data: { type: String },
  nested: {
    level1: {
      level2: { type: String }
    }
  }
});

const Rule = mongoose.model('Rule', ruleSchema);

module.exports = Rule;
