import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Egg Schema - Defines the structure of an Egg document in MongoDB.
 */
const EggSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['common', 'rare', 'epic', 'legendary', 'mythic', 'celestial'],
    },
    element: {
      type: String,
      required: true,
      enum: ['earth', 'fire', 'water', 'air', 'lightning', 'cosmic', 'divine'],
    },
    power: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    metadata: {
      dna: { type: String, unique: true, required: true },
      incubationTime: { type: Number, default: 24 }, // Hours
      hatched: { type: Boolean, default: false },
    },
    market: {
      listed: { type: Boolean, default: false },
      price: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Ensure indexes for faster queries
EggSchema.index({ 'metadata.dna': 1 }, { unique: true });
EggSchema.index({ owner: 1 });
EggSchema.index({ 'market.listed': 1 });

// Model export
const Egg = mongoose.model('Egg', EggSchema);
export default Egg;
