import { Schema, model } from 'mongoose';

/**
 * Mongoose schema for Egg entities in the virtual pet ecosystem
 * Enhanced with validation, indexes, and virtual properties
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
      tags: [
        {
          type: String,
          lowercase: true,
          trim: true,
        },
      ],
      version: {
        type: String,
        default: '1.0.0',
        match: /^\d+\.\d+\.\d+$/,
      },
      generatedBy: String,
      createdAt: {
        type: Date,
        default: Date.now,
        immutable: true,
      },
      properties: {
        size: {
          type: String,
          enum: ['tiny', 'small', 'medium', 'large', 'massive'],
          default: 'medium',
        },
        color: {
          type: String,
          trim: true,
        },
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
          power: {
            type: Number,
            min: 0,
            max: 1000,
            default: 50,
          },
          wisdom: {
            type: Number,
            min: 0,
            max: 1000,
            default: 50,
          },
          harmony: {
            type: Number,
            min: 0,
            max: 1000,
            default: 50,
          },
          speed: {
            type: Number,
            min: 0,
            max: 1000,
            default: 50,
          },
          resilience: {
            type: Number,
            min: 0,
            max: 1000,
            default: 50,
          },
        },
      },
      dna: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      generation: {
        type: Number,
        default: 1,
        min: 1,
        max: 100,
      },
      parentIds: [String],
      evolutionStage: {
        type: Number,
        default: 0,
        min: 0,
      },
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
      duration: {
        type: Number,
        min: 0,
        default: 86400000, // 24 hours in milliseconds
      },
      temperature: {
        type: Number,
        min: -50,
        max: 100,
        default: 37,
      },
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
      optimalTemp: {
        type: Number,
        min: -50,
        max: 100,
      },
      progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    tradeable: {
      type: Boolean,
      default: true,
    },
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
        enum: ['gold', 'gems', 'ether', 'tokens'],
        default: 'gold',
      },
      listDate: Date,
      expiryDate: Date,
      bids: [
        {
          bidder: {
            type: String,
            required: true,
          },
          amount: {
            type: Number,
            required: true,
            min: 0,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
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
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    specialAbilities: [
      {
        name: String,
        description: String,
        cooldown: Number,
        unlocked: {
          type: Boolean,
          default: false,
        },
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
    versionKey: '__v', // Fixed versionKey to be a string instead of boolean
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  },
);

// Indexes for performance optimization
eggSchema.index({ 'metadata.dna': 1 }, { unique: true });
eggSchema.index({ owner: 1 });
eggSchema.index({ 'market.listed': 1 });
eggSchema.index({ 'metadata.rarity': 1, type: 1 });
eggSchema.index({ 'metadata.properties.element': 1 });
eggSchema.index({ status: 1, 'incubationConfig.expectedHatchTime': 1 });

// Virtual for calculating total attribute value
eggSchema.virtual('totalAttributeValue').get(function () {
  const attrs = this.metadata?.properties?.attributes;
  if (!attrs) return 0;

  return Object.values(attrs).reduce((sum, val) => sum + (val || 0), 0);
});

// Virtual for age in days
eggSchema.virtual('ageInDays').get(function () {
  const createdAt = this.metadata?.createdAt || this.createdAt;
  if (!createdAt) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((Date.now() - createdAt.getTime()) / msPerDay);
});

// Virtual for incubation progress percentage
eggSchema.virtual('incubationProgress').get(function () {
  if (this.status !== 'incubating' || !this.incubationConfig?.startTime)
    return 0;
  if (this.status === 'hatched') return 100;

  const start = this.incubationConfig.startTime.getTime();
  const duration = this.incubationConfig.duration || 86400000;
  const elapsed = Date.now() - start;

  return Math.min(100, Math.floor((elapsed / duration) * 100));
});

// Method to validate incubation conditions
eggSchema.methods.validateIncubationConditions = function (
  currentTemperature,
  currentConditions,
) {
  if (!this.incubationConfig) return false;

  const optimalTemp = this.incubationConfig.optimalTemp;
  const tempDifference = Math.abs(currentTemperature - optimalTemp);
  const tempValid = tempDifference <= 10; // Within 10 degrees of optimal

  const requiredConditions = this.incubationConfig.conditions || [];
  const conditionsValid = requiredConditions.every((c) =>
    currentConditions.includes(c),
  );

  return tempValid && conditionsValid;
};

// Static method to find eggs ready to hatch
eggSchema.statics.findReadyToHatch = function () {
  return this.find({
    status: 'incubating',
    'incubationConfig.expectedHatchTime': { $lte: new Date() },
  });
};

// Method to calculate market value based on rarity, attributes, and generation
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
  const attributeModifier = this.totalAttributeValue / 500; // Normalized to 0-10 range for typical values
  const generationModifier =
    1 + 0.1 * (Math.max(1, this.metadata?.generation || 1) - 1);

  // Special type bonuses
  let typeMultiplier = 1.0;
  if (this.type === 'celestial') {
    typeMultiplier = 1.5;
  } else if (this.type === 'phoenix') {
    typeMultiplier = 1.3;
  }

  return Math.round(
    baseValue * (1 + attributeModifier) * generationModifier * typeMultiplier,
  );
};

// Pre-save middleware to automatically set expected hatch time
eggSchema.pre('save', function (next) {
  if (
    this.isModified('status') &&
    this.status === 'incubating' &&
    this.incubationConfig &&
    this.incubationConfig.startTime &&
    this.incubationConfig.duration &&
    !this.incubationConfig.expectedHatchTime
  ) {
    this.incubationConfig.expectedHatchTime = new Date(
      this.incubationConfig.startTime.getTime() +
        this.incubationConfig.duration,
    );
  }
  next();
});

// Export model
export default model('Egg', eggSchema);
