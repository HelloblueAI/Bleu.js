import mongoose from 'mongoose';

// Define the RuleDocument interface to represent a document in MongoDB
interface RuleDocument extends mongoose.Document {
  name: string;
  data: string;
  nested: {
    level1: {
      level2: string;
    };
  };
}

// Extend the Model interface for custom static methods
interface RuleModel extends mongoose.Model<RuleDocument> {
  findByName(this: RuleModel, name: string): Promise<RuleDocument | null>;
}

// Define the schema for the Rule model
const RuleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, minlength: 3 },
  data: { type: String, required: true, maxlength: 500 },
  nested: {
    level1: {
      level2: { type: String, required: true },
    },
  },
});

// Add the custom static method to the schema
RuleSchema.statics.findByName = function (name) {
  return this.findOne({ name });
};

// Create the model with the schema and interfaces
const Rule = mongoose.model<RuleDocument, RuleModel>('Rule', RuleSchema);

export default Rule; // Default export for ES Modules
