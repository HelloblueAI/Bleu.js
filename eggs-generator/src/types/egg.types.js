/**
 * @typedef {Object} EggMetadata
 * @property {string[]} tags - Array of tags associated with the egg
 * @property {string} version - Version of the egg
 * @property {string} generatedBy - Service that generated the egg
 * @property {Map<string, any>} properties - Custom properties map
 * @property {('common'|'uncommon'|'rare'|'legendary'|'mythical'|'divine')} rarity - Extended rarity levels
 * @property {Object} attributes - Egg attributes
 * @property {number} attributes.power - Power level (1-100)
 * @property {number} attributes.potential - Growth potential (1-100)
 * @property {string[]} attributes.elements - Elemental affiliations
 * @property {Object} genetics - Genetic traits
 * @property {string[]} genetics.dominant - Dominant traits
 * @property {string[]} genetics.recessive - Recessive traits
 */

/**
 * @typedef {Object} EggEvolutionHistory
 * @property {string} stage - Evolution stage
 * @property {Date} timestamp - When evolution occurred
 * @property {Object} changes - What changed during evolution
 */

/**
 * @typedef {Object} EggDocument
 * @extends {mongoose.Document}
 * @property {string} id - Unique identifier
 * @property {string} type - Type of egg
 * @property {string} description - Egg description
 * @property {EggMetadata} metadata - Extended egg metadata
 * @property {('incubating'|'hatching'|'hatched'|'evolved'|'dormant'|'expired')} status - Enhanced status options
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {EggEvolutionHistory[]} evolutionHistory - Track egg evolution
 * @property {Object} interactionStats - Interaction statistics
 */

import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { createClient } from 'redis';
import winston from 'winston';
import { promisify } from 'util';
import { createHash } from 'crypto';
import { performance } from 'perf_hooks';
import * as tf from '@tensorflow/tfjs-node';

// Advanced event system with clustering support
class ClusterAwareEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.cluster = require('cluster');
    this.workers = new Map();

    if (this.cluster.isPrimary) {
      this._initializePrimaryNode();
    } else {
      this._initializeWorkerNode();
    }
  }

  _initializePrimaryNode() {
    this.cluster.on('message', (worker, message) => {
      if (message.type === 'EVENT') {
        this.emit(message.event, ...message.args);
      }
    });
  }

  _initializeWorkerNode() {
    const originalEmit = this.emit;
    this.emit = (event, ...args) => {
      process.send({ type: 'EVENT', event, args });
      return originalEmit.call(this, event, ...args);
    };
  }
}

const eggEvents = new ClusterAwareEventEmitter();

class MultiLayerCache {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL, {
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.localCache = new Map();
    this.localCacheTTL = 60 * 1000;
  }

  async get(key) {
    const localResult = this.localCache.get(key);
    if (localResult && localResult.expiry > Date.now()) {
      return localResult.value;
    }

    // Check Redis
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      // Update local cache
      this.localCache.set(key, {
        value: JSON.parse(redisResult),
        expiry: Date.now() + this.localCacheTTL,
      });
      return JSON.parse(redisResult);
    }

    return null;
  }

  async set(key, value, ttl) {
    // Update both caches
    await this.redis.setex(key, ttl, JSON.stringify(value));
    this.localCache.set(key, {
      value,
      expiry: Date.now() + Math.min(ttl * 1000, this.localCacheTTL),
    });
  }
}

const EggSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            v,
          );
        },
        message: (props) => `${props.value} is not a valid UUID v4!`,
      },
    },
    type: {
      type: String,
      required: true,
      index: true,
      minlength: [3, 'Type must be at least 3 characters long'],
      maxlength: [50, 'Type cannot exceed 50 characters'],
    },
    metadata: {
      tags: {
        type: [String],
        validate: {
          validator: function (v) {
            return v.length <= 10;
          },
          message: 'Cannot have more than 10 tags',
        },
      },
      version: String,
      generatedBy: String,
      properties: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
      },
      rarity: {
        type: String,
        enum: {
          values: [
            'common',
            'uncommon',
            'rare',
            'legendary',
            'mythical',
            'divine',
          ],
          message: '{VALUE} is not a valid rarity',
        },
        default: 'common',
        index: true,
      },
      attributes: {
        power: {
          type: Number,
          min: 1,
          max: 100,
          default: () => Math.floor(Math.random() * 100) + 1,
        },
        potential: {
          type: Number,
          min: 1,
          max: 100,
          default: () => Math.floor(Math.random() * 100) + 1,
        },
        elements: [
          {
            type: String,
            enum: ['fire', 'water', 'earth', 'air', 'light', 'dark'],
          },
        ],
      },
      genetics: {
        dominant: [String],
        recessive: [String],
      },
    },
    status: {
      type: String,
      enum: {
        values: [
          'incubating',
          'hatching',
          'hatched',
          'evolved',
          'dormant',
          'expired',
        ],
        message: '{VALUE} is not a valid status',
      },
      default: 'incubating',
      index: true,
    },
    evolutionHistory: [
      {
        stage: String,
        timestamp: Date,
        changes: mongoose.Schema.Types.Mixed,
      },
    ],
    interactionStats: {
      totalInteractions: { type: Number, default: 0 },
      lastInteraction: Date,
      interactionHistory: [
        {
          type: String,
          timestamp: Date,
          effect: String,
        },
      ],
    },
    mlFeatures: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    strict: 'throw',
    minimize: false,
  },
);

EggSchema.methods.evolve = async function () {
  const evolutionProbability = this._calculateEvolutionProbability();
  const canEvolve = Math.random() < evolutionProbability;

  if (canEvolve) {
    const previousStage = this.status;
    this.status = 'evolved';
    this.evolutionHistory.push({
      stage: 'evolution',
      timestamp: new Date(),
      changes: {
        previousStage,
        powerIncrease: Math.floor(Math.random() * 20) + 10,
      },
    });

    this.metadata.attributes.power +=
      this.evolutionHistory[
        this.evolutionHistory.length - 1
      ].changes.powerIncrease;
    await this.save();
    eggEvents.emit('eggEvolved', this);
    return true;
  }

  return false;
};

// Add machine learning capabilities
EggSchema.methods.predictRarity = async function () {
  const model = await tf.loadLayersModel(
    'file://./models/rarity-predictor/model.json',
  );

  const features = [
    this.metadata.attributes.power,
    this.metadata.attributes.potential,
    this.interactionStats.totalInteractions,
    this.evolutionHistory.length,
  ];

  const prediction = model.predict(tf.tensor2d([features]));
  const rarityIndex = (await prediction.data())[0];

  return ['common', 'uncommon', 'rare', 'legendary', 'mythical', 'divine'][
    Math.floor(rarityIndex)
  ];
};

// Advanced static methods
EggSchema.statics.findByGenetics = async function (traits) {
  return this.find({
    $or: [
      { 'metadata.genetics.dominant': { $in: traits } },
      { 'metadata.genetics.recessive': { $in: traits } },
    ],
  }).sort({ createdAt: -1 });
};

// Export everything
export const Egg = mongoose.model('Egg', EggSchema);
export const EggEvents = eggEvents;
export const cache = new MultiLayerCache();

// Performance monitoring
const metrics = {
  eggGeneration: new Map(),
  cacheHits: 0,
  cacheMisses: 0,
  evolutionAttempts: 0,
  successfulEvolutions: 0,
};

export { metrics };
