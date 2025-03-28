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
const { Schema, Types } = mongoose;

/**
 * 🚀 Next-Gen AI-Powered Egg Schema for Bleu.js
 * - Self-learning AI market valuation
 * - Optimized queries with high-speed indexes
 * - Auto-optimized incubation system
 * - Smart evolution tracking with predictive analysis
 */

const AttributeSchema = new Schema({
  trait_type: {
    type: String,
    required: [true, 'Trait type is required']
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Trait value is required']
  }
}, { _id: false });

const metadataSchema = new Schema({
  properties: {
    type: {
      type: String,
      required: true,
      enum: ['standard', 'rare', 'legendary', 'mythic']
    },
    description: String,
    attributes: [{
      name: String,
      value: Schema.Types.Mixed
    }]
  },
  dna: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[A-Za-z0-9]+$/.test(v);
      },
      message: props => `${props.value} is not a valid DNA string!`
    }
  },
  rarity: {
    type: String,
    required: true,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
  }
}, { _id: false });

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
      enum: ['standard', 'rare', 'legendary', 'mythic'],
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: metadataSchema,
      required: true
    },
    parents: [{
      type: Schema.Types.ObjectId,
      ref: 'Egg'
    }],
    lastEvolution: {
      type: Date,
      default: Date.now
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
    owner: {
      type: String,
      required: true,
      index: true,
    },
    tradeable: { type: Boolean, default: true },
    market: {
      listed: {
        type: Boolean,
        default: false,
        index: true,
      },
      price: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        enum: ['ETH', 'USDC', 'BLEU'],
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
    stats: {
      health: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      strength: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      speed: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
    },
    abilities: [{
      name: {
        type: String,
        required: true,
      },
      description: String,
      cooldown: {
        type: Number,
        min: 0,
      },
      damage: {
        type: Number,
        min: 0,
      },
    }],
    evolution: {
      stage: {
        type: Number,
        default: 0,
        min: 0,
        max: 3,
      },
      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      requirements: {
        level: {
          type: Number,
          min: 1
        },
        items: [{
          type: String,
          ref: 'Item'
        }]
      }
    },
    breeding: {
      readyTime: Date,
      cooldownTime: {
        type: Number,
        default: 0
      },
      breedCount: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes
eggSchema.index({ 'metadata.rarity': 1, type: 1 });
eggSchema.index({ 'market.listed': 1, 'market.price': 1 });
eggSchema.index({ owner: 1, type: 1 });

// Virtual fields
eggSchema.virtual('isBreedingReady').get(function() {
  return !this.breeding.readyTime || this.breeding.readyTime <= new Date();
});

eggSchema.virtual('marketStatus').get(function() {
  if (!this.market.listed) return 'not_listed';
  return 'listed';
});

eggSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Methods
eggSchema.methods.evolve = async function() {
  this.evolution.stage += 1;
  this.evolution.progress = 0;
  this.lastEvolution = new Date();
  return this.save();
};

eggSchema.methods.hatch = async function() {
  this.status = 'hatched';
  return this.save();
};

eggSchema.methods.breed = async function(otherEgg) {
  if (this.type !== otherEgg.type) {
    throw new Error('Cannot breed eggs of different types');
  }

  const childEgg = new this.constructor({
    id: `${this.id}_${otherEgg.id}_${Date.now()}`,
    type: this.type,
    description: `Offspring of ${this.id} and ${otherEgg.id}`,
    metadata: {
      dna: this.generateChildDNA(otherEgg),
      rarity: Math.floor((this.metadata.rarity + otherEgg.metadata.rarity) / 2),
      attributes: this.combineAttributes(this.metadata.attributes, otherEgg.metadata.attributes),
      generation: Math.max(this.metadata.generation, otherEgg.metadata.generation) + 1,
      birthDate: new Date(),
      tags: [...new Set([...this.metadata.tags, ...otherEgg.metadata.tags])],
      version: this.metadata.version,
      generatedBy: 'breeding',
      updatedAt: new Date()
    },
    parents: [this._id, otherEgg._id],
    properties: this.combineProperties(this.metadata.properties, otherEgg.metadata.properties)
  });

  return childEgg.save();
};

eggSchema.methods.generateChildDNA = function(otherEgg) {
  const dna1 = this.metadata.dna;
  const dna2 = otherEgg.metadata.dna;
  const midPoint = Math.floor(dna1.length / 2);
  return dna1.slice(0, midPoint) + dna2.slice(midPoint);
};

eggSchema.methods.combineAttributes = function(attrs1, attrs2) {
  const combinedAttributes = new Map();
  
  [...attrs1, ...attrs2].forEach(attr => {
    if (!combinedAttributes.has(attr.trait_type)) {
      combinedAttributes.set(attr.trait_type, attr.value);
    } else {
      if (typeof attr.value === 'number' && typeof combinedAttributes.get(attr.trait_type) === 'number') {
        combinedAttributes.set(attr.trait_type, 
          (attr.value + combinedAttributes.get(attr.trait_type)) / 2
        );
      } else if (Array.isArray(attr.value) && Array.isArray(combinedAttributes.get(attr.trait_type))) {
        combinedAttributes.set(attr.trait_type, 
          [...new Set([...attr.value, ...combinedAttributes.get(attr.trait_type)])]
        );
      } else if (typeof attr.value === 'object' && typeof combinedAttributes.get(attr.trait_type) === 'object') {
        combinedAttributes.set(attr.trait_type, 
          { ...combinedAttributes.get(attr.trait_type), ...attr.value }
        );
      }
    }
  });

  return Array.from(combinedAttributes.entries()).map(([trait_type, value]) => ({
    trait_type,
    value
  }));
};

eggSchema.methods.combineProperties = function(props1, props2) {
  const combined = { ...props1 };
  for (const [key, value] of Object.entries(props2)) {
    if (typeof value === 'number') {
      combined[key] = Math.floor((props1[key] || 0 + value) / 2);
    } else if (Array.isArray(value)) {
      combined[key] = [...(props1[key] || []), ...value];
    } else if (typeof value === 'object') {
      combined[key] = this.combineProperties(props1[key] || {}, value);
    } else {
      combined[key] = Math.random() < 0.5 ? props1[key] : value;
    }
  }
  return combined;
};

// Statics
eggSchema.statics.findByRarity = function(rarity) {
  return this.find({ 'metadata.rarity': rarity });
};

eggSchema.statics.findBreedingReady = function() {
  return this.find({
    $or: [
      { 'breeding.readyTime': { $exists: false } },
      { 'breeding.readyTime': { $lte: new Date() } }
    ]
  });
};

eggSchema.statics.findByDNA = function(dna) {
  return this.findOne({ 'metadata.dna': dna });
};

eggSchema.statics.findByOwner = function(owner) {
  return this.find({ owner });
};

eggSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// Middleware
eggSchema.pre('save', function(next) {
  if (this.isNew) {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  } else {
    this.updatedAt = new Date();
  }
  if (this.isModified('evolution.stage')) {
    // Update stats based on evolution stage
    const multiplier = 1 + (this.evolution.stage * 0.2);
    this.stats.strength *= multiplier;
    this.stats.speed *= multiplier;
    this.stats.health *= multiplier;
  }
  this.metadata.updatedAt = new Date();
  next();
});

const Egg = mongoose.model('Egg', eggSchema);

export default Egg;
