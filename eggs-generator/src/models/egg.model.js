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

import mongoose from 'mongoose';
import crypto from 'crypto';

const EggSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true, unique: true },
    type: { type: String, required: true, index: true },
    description: { type: String, required: true },
    metadata: {
      tags: [{ type: String, index: true }],
      version: { type: String, default: '1.0.37' },
      generatedBy: { type: String, default: 'Eggs-Generator AI v4.0' },
      properties: { type: Map, of: mongoose.Schema.Types.Mixed },
      rarity: {
        type: String,
        enum: [
          'common',
          'uncommon',
          'rare',
          'legendary',
          'mythical',
          'divine',
          'unique',
        ],
        default: 'common',
        index: true,
      },
      attributes: [
        {
          trait_type: String,
          value: mongoose.Schema.Types.Mixed,
          rarity_score: Number,
        },
      ],
      dna: { type: String, unique: true, sparse: true },
      aiFingerprint: { type: String, unique: true, index: true },
      generation: { type: Number, default: 1 },
    },
    status: {
      type: String,
      enum: [
        'incubating',
        'hatching',
        'hatched',
        'evolved',
        'expired',
        'traded',
      ],
      default: 'incubating',
      index: true,
    },
    incubationConfig: {
      startTime: { type: Date, default: Date.now },
      duration: { type: Number, default: 86400 },
      temperature: { type: Number, min: 0, max: 100, default: 37 },
      conditions: [
        {
          type: String,
          effect: String,
          multiplier: Number,
        },
      ],
      optimalTemp: { type: Number, default: 37 },
    },
    evolution: {
      stage: { type: Number, default: 1 },
      possibleEvolutions: [
        {
          type: String,
          probability: Number,
        },
      ],
      powerLevel: { type: Number, default: 1 },
      experience: { type: Number, default: 0 },
      history: [
        {
          stage: Number,
          timestamp: Date,
        },
      ],
    },
    interactions: {
      total: { type: Number, default: 0 },
      history: [
        {
          type: String,
          timestamp: Date,
          effect: String,
        },
      ],
    },
    owner: {
      type: String,
      default: 'system',
      index: true,
    },
    ownershipHistory: [
      {
        previousOwner: String,
        newOwner: String,
        timestamp: Date,
      },
    ],
    tradeable: { type: Boolean, default: true },
    market: {
      listed: { type: Boolean, default: false },
      bids: [
        {
          bidder: String,
          amount: Number,
          timestamp: Date,
        },
      ],
      realTimePrice: { type: Number, default: 0 },
      priceHistory: [
        {
          timestamp: Date,
          price: Number,
        },
      ],
    },
    security: {
      signature: {
        type: String,
        default: function () {
          return crypto
            .createHash('sha256')
            .update(`${this.id}-${this.owner}-${Date.now()}`)
            .digest('hex');
        },
      },
      validation: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

/** Auto-Generate AI Fingerprint Before Saving */
EggSchema.pre('save', function (next) {
  if (!this.metadata.aiFingerprint) {
    this.metadata.aiFingerprint = crypto
      .createHash('sha256')
      .update(`${this.id}-${this.type}-${Date.now()}`)
      .digest('hex');
  }
  next();
});

/** Indexing for Performance */
EggSchema.index({ 'metadata.rarity': 1, createdAt: -1 });
EggSchema.index({ status: 1, 'metadata.tags': 1 });
EggSchema.index({ 'market.realTimePrice': -1 });
EggSchema.index({ owner: 1, 'ownershipHistory.timestamp': -1 });

export const Egg = mongoose.model('Egg', EggSchema);
