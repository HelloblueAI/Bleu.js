import { Schema, model } from 'mongoose';

const ruleSchema = new Schema({
  name: { type: String, required: true },
  data: { type: String },
  nested: {
    level1: {
      level2: { type: String },
    },
  },
});

const Rule = model('Rule', ruleSchema);

export default Rule;
