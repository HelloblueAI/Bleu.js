const mongoose = require('mongoose');

const AiQuerySchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  modelUsed: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    default: 0.95,
  },
});

const AiQuery = mongoose.model('AiQuery', AiQuerySchema);

module.exports = AiQuery;
