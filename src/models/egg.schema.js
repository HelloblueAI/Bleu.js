const mongoose = require('mongoose');

const eggSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    type: {
      type: String,
      required: true,
      enum: ['dragon', 'phoenix', 'celestial'],
    },
    description: { type: String, required: true },
    metadata: {
      tags: [String],
      version: String,
      generatedBy: String,
      properties: {
        size: {
          type: String,
          enum: ['small', 'medium', 'large'],
        },
        color: String,
        rarity: {
          type: String,
          enum: ['common', 'rare', 'legendary', 'mythical'],
        },
        element: String,
        attributes: {
          power: { type: Number, min: 0, max: 100 },
          wisdom: { type: Number, min: 0, max: 100 },
          harmony: { type: Number, min: 0, max: 100 },
        },
      },
      dna: String,
      generation: { type: Number, default: 1 },
    },
    status: {
      type: String,
      enum: ['created', 'incubating', 'hatched'],
      default: 'created',
    },
    incubationConfig: {
      startTime: Date,
      duration: Number,
      temperature: Number,
      conditions: [String],
      optimalTemp: Number,
    },
    owner: { type: String, required: true },
    tradeable: { type: Boolean, default: true },
    market: {
      listed: { type: Boolean, default: false },
      price: Number,
      bids: [
        {
          bidder: String,
          amount: Number,
          timestamp: Date,
        },
      ],
    },
  },
  {
    timestamps: true,
    versionKey: true,
  },
);

eggSchema.index({ 'metadata.dna': 1 }, { unique: true });
eggSchema.index({ owner: 1 });
eggSchema.index({ 'market.listed': 1 });

module.exports = mongoose.model('Egg', eggSchema);
