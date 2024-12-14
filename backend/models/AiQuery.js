import mongoose from 'mongoose';

// Define the schema for storing AI queries
const AiQuerySchema = new mongoose.Schema({
  query: {
    type: String,
    required: [true, 'Query field is required'],
    trim: true,
    minlength: [1, 'Query must not be empty'],
  },
  response: {
    type: String,
    required: [true, 'Response field is required'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  modelUsed: {
    type: String,
    required: [true, 'Model used field is required'],
    trim: true,
    minlength: [1, 'Model used field must not be empty'],
  },
  confidence: {
    type: Number,
    default: 0.95,
    min: [0, 'Confidence must be at least 0'],
    max: [1, 'Confidence must be at most 1'],
  },
});

// Pre-save validation to ensure required fields are not empty
AiQuerySchema.pre('save', function (next) {
  if (!this.query.trim() || !this.response.trim()) {
    return next(new Error('Query and Response fields must not be empty.'));
  }
  return next(); // Explicitly return next
});

// Index for faster querying by query and createdAt fields
AiQuerySchema.index({ query: 1, createdAt: -1 });

// Model for AI queries
const AiQuery = mongoose.model('AiQuery', AiQuerySchema);

export default AiQuery;
