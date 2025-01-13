import { Schema, model } from 'mongoose';

const AiQuerySchema = new Schema({
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

const AiQuery = model('AiQuery', AiQuerySchema);

export default AiQuery;
