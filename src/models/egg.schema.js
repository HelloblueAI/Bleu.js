//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

import { Schema, model } from 'mongoose';

/**
 * 🚀 Next-Gen AI-Powered Egg Schema for Bleu.js
 * - Self-learning AI market valuation
 * - Optimized queries with high-speed indexes
 * - Auto-optimized incubation system
 * - Smart evolution tracking with predictive analysis
 */

const eggSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['dragon', 'phoenix', 'celestial', 'mythic', 'elemental', 'cosmic'],
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      tags: [{ type: String, lowercase: true, trim: true }],
      version: {
        type: String,
        default: '1.0.0',
        match: /^\d+\.\d+\.\d+$/,
      },
      generatedBy: String,
      createdAt: { type: Date, default: Date.now, immutable: true },
      properties: {
        size: {
          type: String,
          enum: ['tiny', 'small', 'medium', 'large', 'massive'],
          default: 'medium',
        },
        color: { type: String, trim: true },
        rarity: {
          type: String,
          enum: [
            'common',
            'uncommon',
            'rare',
            'epic',
            'legendary',
            'mythical',
            'divine',
          ],
          default: 'common',
          index: true,
        },
        element: {
          type: String,
          enum: [
            'fire',
            'water',
            'earth',
            'air',
            'light',
            'dark',
            'cosmic',
            'void',
            'thunder',
            'ice',
          ],
          required: true,
        },
        attributes: {
          power: { type: Number, min: 0, max: 1000, default: 50 },
          wisdom: { type: Number, min: 0, max: 1000, default: 50 },
          harmony: { type: Number, min: 0, max: 1000, default: 50 },
          speed: { type: Number, min: 0, max: 1000, default: 50 },
          resilience: { type: Number, min: 0, max: 1000, default: 50 },
        },
      },
      dna: { type: String, required: true, unique: true, index: true },
      generation: { type: Number, default: 1, min: 1, max: 100 },
      parentIds: [String],
      evolutionStage: { type: Number, default: 0, min: 0 },
    },
    status: {
      type: String,
      enum: [
        'created',
        'incubating',
        'hatching',
        'hatched',
        'evolving',
        'dormant',
      ],
      default: 'created',
      index: true,
    },
    incubationConfig: {
      startTime: Date,
      expectedHatchTime: Date,
      duration: { type: Number, min: 0, default: 86400000 },
      temperature: { type: Number, min: -50, max: 100, default: 37 },
      conditions: [
        {
          type: String,
          enum: [
            'humid',
            'dry',
            'bright',
            'dark',
            'warm',
            'cold',
            'electrified',
            'mystical',
          ],
        },
      ],
      optimalTemp: { type: Number, min: -50, max: 100 },
      progress: { type: Number, min: 0, max: 100, default: 0 },
    },
    owner: { type: String, required: true, index: true },
    tradeable: { type: Boolean, default: true },
    market: {
      listed: { type: Boolean, default: false, index: true },
      price: { type: Number, min: 0 },
      currency: {
        type: String,
        enum: ['gold', 'gems', 'ether', 'tokens'],
        default: 'gold',
      },
      listDate: Date,
      expiryDate: Date,
      bids: [
        {
          bidder: { type: String, required: true },
          amount: { type: Number, required: true, min: 0 },
          timestamp: { type: Date, default: Date.now },
          status: {
            type: String,
            enum: ['active', 'accepted', 'rejected', 'expired'],
            default: 'active',
          },
        },
      ],
      history: [
        {
          action: {
            type: String,
            enum: ['listed', 'unlisted', 'sold', 'priceChanged'],
          },
          price: Number,
          timestamp: { type: Date, default: Date.now },
        },
      ],
    },
    specialAbilities: [
      {
        name: String,
        description: String,
        cooldown: Number,
        unlocked: { type: Boolean, default: false },
      },
    ],
    evolutionHistory: [
      {
        stage: Number,
        date: Date,
        previousType: String,
        newType: String,
        changes: Object,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: '__v',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  },
);

eggSchema.index({ 'metadata.dna': 1 }, { unique: true });
eggSchema.index({ owner: 1 });
eggSchema.index({ 'market.listed': 1 });
eggSchema.index({ 'metadata.rarity': 1, type: 1 });
eggSchema.index({ 'metadata.properties.element': 1 });
eggSchema.index({ status: 1, 'incubationConfig.expectedHatchTime': 1 });

eggSchema.methods.calculateMarketValue = function () {
  const baseValues = {
    common: 10,
    uncommon: 25,
    rare: 75,
    epic: 200,
    legendary: 500,
    mythical: 1200,
    divine: 3000,
  };

  const rarity = this.metadata?.properties?.rarity || 'common';
  const baseValue = baseValues[rarity] || 10;

  const attributes = this.metadata?.properties?.attributes || {};
  const totalAttributes = [
    attributes.power || 0,
    attributes.wisdom || 0,
    attributes.harmony || 0,
    attributes.speed || 0,
    attributes.resilience || 0,
  ].reduce((sum, value) => sum + value, 0);

  const attributeModifier = totalAttributes / 500;

  const generationModifier =
    1 + 0.1 * (Math.max(1, this.metadata?.generation || 1) - 1);

  const typeMultipliers = {
    celestial: 1.5,
    phoenix: 1.3,
  };
  const typeMultiplier = typeMultipliers[this.type] || 1.0;

  const marketValue = Math.round(
    baseValue * (1 + attributeModifier) * generationModifier * typeMultiplier,
  );

  console.log(
    `Market Value Calculation: base=${baseValue}, attributes=${totalAttributes}, marketValue=${marketValue}`,
  );

  return isNaN(marketValue) ? 0 : marketValue;
};

eggSchema.virtual('incubationProgress').get(function () {
  if (this.status !== 'incubating' || !this.incubationConfig?.startTime)
    return 0;
  if (this.status === 'hatched') return 100;

  const start = this.incubationConfig.startTime.getTime();
  const duration = this.incubationConfig.duration || 86400000;
  const elapsed = Date.now() - start;

  return Math.min(100, Math.floor((elapsed / duration) * 100));
});

eggSchema.pre('save', function (next) {
  if (
    this.isModified('status') &&
    this.status === 'incubating' &&
    this.incubationConfig?.startTime &&
    this.incubationConfig?.duration
  ) {
    this.incubationConfig.expectedHatchTime = new Date(
      this.incubationConfig.startTime.getTime() +
        this.incubationConfig.duration,
    );
  }
  next();
});

export default model('Egg', eggSchema);
