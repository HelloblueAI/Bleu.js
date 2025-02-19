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
