import express from 'express';
import { Egg } from '../models/egg.model.js';
import { logger } from '../utils/logger.js';
import { redisClient } from '../utils/redis.js';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { MARKET_CONFIG } from '../config/marketConfig.js';
import { generateDNA, calculateRarityScore, calculateInitialPower } from '../utils/eggUtils.js';
import { broadcastMessage } from '../utils/webSocketUtils.js';
import Joi from 'joi';
import crypto from 'crypto';

const router = express.Router();

/** 🚀 Dynamic Rate Limiting (Prevents abuse & ensures fair monetization) */
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 10, // Default limit: 10 requests per 60 seconds
  duration: 60,
  blockDuration: 30, // Block for 30 sec if limit exceeded
});

/** ✅ Joi Schema Validation (Ensures input integrity) */
const eggSchema = Joi.object({
  type: Joi.string().valid('dragon', 'phoenix', 'celestial').required(),
  description: Joi.string().max(500).optional(),
  parameters: Joi.object({
    rarity: Joi.string().valid('common', 'uncommon', 'rare', 'legendary', 'mythical', 'divine', 'unique').required(),
    element: Joi.string().valid('fire', 'water', 'earth', 'air', 'divine', 'shadow').required(),
    size: Joi.string().valid('small', 'medium', 'large', 'massive').optional(),
    power: Joi.number().min(100).max(9999).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }).required(),
  tier: Joi.string().valid('FREE', 'PRO', 'ENTERPRISE').default('FREE'),
});

/** 🔍 Fetch All Eggs (⚡ Cached for 5 minutes) */
router.get('/', async (req, res) => {
  try {
    const cachedEggs = await redisClient.get('eggs_cache');
    if (cachedEggs) {
      return res.json({ success: true, cached: true, eggs: JSON.parse(cachedEggs) });
    }

    const eggs = await Egg.find().lean();
    await redisClient.set('eggs_cache', JSON.stringify(eggs), { EX: 300 });

    res.json({ success: true, cached: false, eggs });
  } catch (error) {
    logger.error('❌ Failed to fetch eggs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch eggs' });
  }
});

/** 🔍 Fetch Egg by ID */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const egg = await Egg.findOne({ id });

    if (!egg) return res.status(404).json({ success: false, error: 'Egg not found' });

    res.json({ success: true, egg });
  } catch (error) {
    logger.error('❌ Failed to fetch egg:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch egg' });
  }
});

/** 🚀 Generate Egg (💰 Monetization Ready) */
router.post('/generate-egg', async (req, res) => {
  try {
    await rateLimiter.consume(req.ip); // Apply rate limiting

    // Validate Request Data
    const { error, value } = eggSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: error.details });
    }

    const { type, description, parameters, tier } = value;
    const tierConfig = MARKET_CONFIG.TIERS[tier];

    if (!tierConfig) {
      return res.status(403).json({ success: false, error: 'Invalid tier', availableTiers: Object.keys(MARKET_CONFIG.TIERS) });
    }

    // 🛠 Egg Data Model
    const egg = new Egg({
      id: crypto.randomUUID(),
      type,
      description: description || `A powerful ${parameters.rarity} ${type} egg`,
      metadata: {
        tags: parameters?.tags || [],
        version: '1.0.40',
        generatedBy: 'Eggs-Generator v1.0.40',
        properties: parameters,
        rarity: parameters.rarity,
        attributes: [
          { trait_type: 'element', value: parameters.element, rarity_score: calculateRarityScore(parameters.rarity) },
        ],
        dna: generateDNA(),
      },
      status: 'incubating',
      incubationConfig: {
        startTime: new Date(),
        duration: 86400, // Default incubation period: 24 hours
        temperature: 37,
      },
      evolution: {
        stage: 1,
        powerLevel: calculateInitialPower(parameters.rarity),
        experience: 0,
      },
      market: { listed: false, bids: [] },
    });

    await egg.save();
    await redisClient.del('eggs_cache'); // Invalidate cache
    broadcastMessage({ event: 'new_egg', egg }); // Notify WebSocket clients

    res.json({ success: true, result: egg, market: { tier: tierConfig, tradingEnabled: tier !== 'FREE' } });
  } catch (error) {
    if (error.name === 'RateLimiterRes') {
      return res.status(429).json({ success: false, error: 'Too many requests, slow down!' });
    }
    logger.error('❌ Egg generation failed:', error);
    res.status(500).json({ success: false, error: 'Generation failed' });
  }
});

/** 🔥 Delete Egg */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEgg = await Egg.findOneAndDelete({ id });

    if (!deletedEgg) return res.status(404).json({ success: false, error: 'Egg not found' });

    await redisClient.del('eggs_cache');
    broadcastMessage({ event: 'egg_deleted', id });

    
    res.json({ success: true, message: 'Egg deleted successfully' });
  } catch (error) {
    logger.error('❌ Failed to delete egg:', error);
    res.status(500).json({ success: false, error: 'Failed to delete egg' });
  }
});


export default router;
