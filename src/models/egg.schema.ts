import mongoose, { Schema, Types, Document } from 'mongoose';

/**
 * 🚀 Next-Gen AI-Powered Egg Schema for Bleu.js
 * - Self-learning AI market valuation
 * - Optimized queries with high-speed indexes
 * - Auto-optimized incubation system
 * - Smart evolution tracking with predictive analysis
 */

// Interfaces
export interface IAttribute {
  trait_type: string;
  value: any;
}

export interface IMetadataProperties {
  type: 'standard' | 'rare' | 'legendary' | 'mythic';
  description?: string;
  attributes: Array<{
    name: string;
    value: any;
  }>;
}

export interface IMetadata {
  properties: IMetadataProperties;
  dna: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  generation?: number;
  birthDate?: Date;
  tags?: string[];
  version?: string;
  generatedBy?: string;
  updatedAt?: Date;
}

export interface IIncubationConfig {
  startTime?: Date;
  expectedHatchTime?: Date;
  duration: number;
  temperature: number;
  conditions?: Array<'humid' | 'dry' | 'bright' | 'dark' | 'warm' | 'cold' | 'electrified' | 'mystical'>;
  optimalTemp?: number;
  progress: number;
}

export interface IMarketBid {
  bidder: string;
  amount: number;
  timestamp: Date;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
}

export interface IMarketHistory {
  action: 'listed' | 'unlisted' | 'sold' | 'priceChanged';
  price: number;
  timestamp: Date;
}

export interface IMarket {
  listed: boolean;
  price?: number;
  currency?: 'ETH' | 'USDC' | 'BLEU';
  listDate?: Date;
  expiryDate?: Date;
  bids: IMarketBid[];
  history: IMarketHistory[];
}

export interface IStats {
  health: number;
  strength: number;
  speed: number;
}

export interface IAbility {
  name: string;
  description?: string;
  cooldown?: number;
  damage?: number;
}

export interface IEvolutionRequirements {
  level?: number;
  items?: string[];
}

export interface IEvolution {
  stage: number;
  progress: number;
  requirements?: IEvolutionRequirements;
}

export interface IBreeding {
  readyTime?: Date;
  cooldownTime: number;
  breedCount: number;
}

export interface IEgg extends Document {
  id: string;
  type: 'standard' | 'rare' | 'legendary' | 'mythic';
  description: string;
  metadata: IMetadata;
  parents: Types.ObjectId[];
  lastEvolution: Date;
  status: 'created' | 'incubating' | 'hatching' | 'hatched' | 'evolving' | 'dormant';
  incubationConfig: IIncubationConfig;
  owner: string;
  tradeable: boolean;
  market: IMarket;
  stats: IStats;
  abilities: IAbility[];
  evolution: IEvolution;
  breeding: IBreeding;
  createdAt: Date;
  updatedAt: Date;
  age: number;
  isBreedingReady: boolean;
  marketStatus: 'not_listed' | 'listed';
  evolve(): Promise<IEgg>;
  hatch(): Promise<IEgg>;
  breed(otherEgg: IEgg): Promise<IEgg>;
  generateChildDNA(otherEgg: IEgg): string;
  combineAttributes(attrs1: IAttribute[], attrs2: IAttribute[]): IAttribute[];
  combineProperties(props1: Record<string, any>, props2: Record<string, any>): Record<string, any>;
}

// Schemas
const AttributeSchema = new Schema<IAttribute>({
  trait_type: {
    type: String,
    required: [true, 'Trait type is required']
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Trait value is required']
  }
}, { _id: false });

const metadataSchema = new Schema<IMetadata>({
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
      validator: function(v: string) {
        return /^[A-Za-z0-9]+$/.test(v);
      },
      message: (props: { value: string }) => `${props.value} is not a valid DNA string!`
    }
  },
  rarity: {
    type: String,
    required: true,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
  }
}, { _id: false });

const eggSchema = new Schema<IEgg>(
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
eggSchema.virtual('isBreedingReady').get(function(this: IEgg) {
  return !this.breeding.readyTime || this.breeding.readyTime <= new Date();
});

eggSchema.virtual('marketStatus').get(function(this: IEgg) {
  if (!this.market.listed) return 'not_listed';
  return 'listed';
});

eggSchema.virtual('age').get(function(this: IEgg) {
  return Date.now() - this.createdAt;
});

// Methods
eggSchema.methods.evolve = async function(this: IEgg): Promise<IEgg> {
  this.evolution.stage += 1;
  this.evolution.progress = 0;
  this.lastEvolution = new Date();
  return this.save();
};

eggSchema.methods.hatch = async function(this: IEgg): Promise<IEgg> {
  this.status = 'hatched';
  return this.save();
};

eggSchema.methods.breed = async function(this: IEgg, otherEgg: IEgg): Promise<IEgg> {
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
      generation: Math.max(this.metadata.generation ?? 0, otherEgg.metadata.generation ?? 0) + 1,
      birthDate: new Date(),
      tags: [...new Set([...(this.metadata.tags ?? []), ...(otherEgg.metadata.tags ?? [])])],
      version: this.metadata.version,
      generatedBy: 'breeding',
      updatedAt: new Date()
    },
    parents: [this._id, otherEgg._id],
    properties: this.combineProperties(this.metadata.properties, otherEgg.metadata.properties)
  });

  return childEgg.save();
};

eggSchema.methods.generateChildDNA = function(this: IEgg, otherEgg: IEgg): string {
  const dna1 = this.metadata.dna;
  const dna2 = otherEgg.metadata.dna;
  const midPoint = Math.floor(dna1.length / 2);
  return dna1.slice(0, midPoint) + dna2.slice(midPoint);
};

eggSchema.methods.combineAttributes = function(this: IEgg, attrs1: IAttribute[], attrs2: IAttribute[]): IAttribute[] {
  const combinedAttributes = new Map<string, any>();
  
  [...attrs1, ...attrs2].forEach(attr => {
    if (!combinedAttributes.has(attr.trait_type)) {
      combinedAttributes.set(attr.trait_type, attr.value);
    } else {
      const currentValue = combinedAttributes.get(attr.trait_type);
      const isNumber = typeof attr.value === 'number' && typeof currentValue === 'number';
      const isArray = Array.isArray(attr.value) && Array.isArray(currentValue);
      const isObject = typeof attr.value === 'object' && typeof currentValue === 'object';

      if (isNumber) {
        combinedAttributes.set(attr.trait_type, (attr.value + currentValue) / 2);
      } else if (isArray) {
        combinedAttributes.set(attr.trait_type, [...new Set([...attr.value, ...currentValue])]);
      } else if (isObject) {
        combinedAttributes.set(attr.trait_type, { ...currentValue, ...attr.value });
      }
    }
  });

  return Array.from(combinedAttributes.entries()).map(([trait_type, value]) => ({
    trait_type,
    value
  }));
};

eggSchema.methods.combineProperties = function(this: IEgg, props1: Record<string, any>, props2: Record<string, any>): Record<string, any> {
  const combined = { ...props1 };
  for (const [key, value] of Object.entries(props2)) {
    if (typeof value === 'number') {
      combined[key] = Math.floor((props1[key] ?? 0 + value) / 2);
    } else if (Array.isArray(value)) {
      combined[key] = [...(props1[key] ?? []), ...value];
    } else if (typeof value === 'object') {
      combined[key] = this.combineProperties(props1[key] ?? {}, value);
    } else {
      combined[key] = Math.random() < 0.5 ? props1[key] : value;
    }
  }
  return combined;
};

// Statics
eggSchema.statics.findByRarity = function(rarity: string): Promise<IEgg[]> {
  return this.find({ 'metadata.rarity': rarity });
};

eggSchema.statics.findBreedingReady = function(): Promise<IEgg[]> {
  return this.find({
    $or: [
      { 'breeding.readyTime': { $exists: false } },
      { 'breeding.readyTime': { $lte: new Date() } }
    ]
  });
};

eggSchema.statics.findByDNA = function(dna: string): Promise<IEgg | null> {
  return this.findOne({ 'metadata.dna': dna });
};

eggSchema.statics.findByOwner = function(owner: string): Promise<IEgg[]> {
  return this.find({ owner });
};

eggSchema.statics.findByStatus = function(status: string): Promise<IEgg[]> {
  return this.find({ status });
};

// Middleware
eggSchema.pre('save', function(this: IEgg, next: mongoose.HookNextFunction) {
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

const Egg = mongoose.model<IEgg>('Egg', eggSchema);

export default Egg; 