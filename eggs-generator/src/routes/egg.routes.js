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
import express from 'express';
import { Egg } from '../models/egg.model.js';
import { logger } from '../utils/logger.js';
import { redisClient } from '../utils/redis.js';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { MARKET_CONFIG } from '../config/marketConfig.js';
import { generateDNA, calculateInitialPower } from '../utils/eggUtils.js';
import { predictEggPrice } from '../utils/aiPricePredictor.js';
import { broadcastMessage } from '../utils/webSocketUtils.js';
import Joi from 'joi';
import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

router.use((req, res, next) => {
  const key = req.headers['x-api-key'];

  console.log('🔑 Received API Key:', key);
  console.log('✅ Expected API Key:', process.env.API_KEY);

  if (!key || key.trim() !== process.env.API_KEY.trim()) {
    logger.warn(
      `❌ Unauthorized access attempt - API Key: ${key ? key.slice(0, 4) + '***' : 'None'}`,
    );
    return res
      .status(403)
      .json({ success: false, error: 'Unauthorized. Invalid API key.' });
  }

  logger.info(`✅ API Key authenticated successfully`);
  next();
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 15,
  duration: 60,
  blockDuration: 30,
  keyPrefix: 'rate-limit-eggs',
});

const eggSchema = Joi.object({
  type: Joi.string().valid('dragon', 'phoenix', 'celestial').required(),
  description: Joi.string().max(500).optional(),
  parameters: Joi.object({
    rarity: Joi.string()
      .valid(
        'common',
        'uncommon',
        'rare',
        'legendary',
        'mythical',
        'divine',
        'unique',
      )
      .required(),
    element: Joi.string()
      .valid('fire', 'water', 'earth', 'air', 'divine', 'shadow')
      .required(),
    size: Joi.string().valid('small', 'medium', 'large', 'massive').optional(),
    power: Joi.number().min(100).max(9999).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }).required(),
  tier: Joi.string().valid('FREE', 'PRO', 'ENTERPRISE').default('FREE'),
});

router.get('/', async (req, res, next) => {
  try {
    const {
      type,
      rarity,
      listed,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = req.query;
    const cacheKey = `eggs:${page}:${limit}:${type || 'any'}:${rarity || 'any'}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData)
      return res.json({
        success: true,
        cached: true,
        eggs: JSON.parse(cachedData),
      });

    const query = {};
    if (type) query.type = type;
    if (rarity) query['metadata.rarity'] = rarity;
    if (listed !== undefined) query['market.listed'] = listed === 'true';

    const eggs = await Egg.find(query)
      .select('-__v')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    await redisClient.set(cacheKey, JSON.stringify(eggs), { EX: 300 }); // Cache for 5 minutes
    logger.info(`📦 Eggs data cached: ${cacheKey}`);

    res.json({
      success: true,
      cached: false,
      page: Number(page),
      limit: Number(limit),
      eggs,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid Egg ID' });
    }

    const egg = await Egg.findById(id).select('-__v');
    if (!egg)
      return res.status(404).json({ success: false, error: 'Egg not found' });

    res.json({ success: true, egg });
  } catch (error) {
    next(error);
  }
});

/** 🚀 Generate Egg with AI Pricing */
router.post('/generate-egg', async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);

    const { error, value } = eggSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res.status(400).json({ success: false, error: error.details });

    const { type, description, parameters, tier } = value;
    const tierConfig = MARKET_CONFIG.TIERS[tier];

    if (!tierConfig) {
      return res.status(403).json({
        success: false,
        error: 'Invalid tier',
        availableTiers: Object.keys(MARKET_CONFIG.TIERS),
      });
    }

    const price = predictEggPrice(
      parameters.rarity,
      parameters.element,
      parameters.size,
    );
    logger.info(`💰 AI-Priced ${parameters.rarity} ${type} egg at $${price}`);

    const egg = new Egg({
      id: crypto.randomUUID(),
      type,
      description: description || `A ${parameters.rarity} ${type} egg`,
      metadata: {
        properties: parameters,
        rarity: parameters.rarity,
        dna: generateDNA(),
      },
      status: 'incubating',
      evolution: {
        stage: 1,
        powerLevel: calculateInitialPower(parameters.rarity),
      },
      market: { listed: true, price },
    });

    await egg.save();
    await redisClient.del('eggs_cache');
    broadcastMessage({ event: 'new_egg', egg });

    res.json({
      success: true,
      result: egg,
      market: { tier: tierConfig, tradingEnabled: tier !== 'FREE' },
    });
  } catch (error) {
    next(error);
  }
});

/** 🔥 Delete Egg */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid Egg ID' });
    }

    const deletedEgg = await Egg.findByIdAndDelete(id);
    if (!deletedEgg)
      return res.status(404).json({ success: false, error: 'Egg not found' });

    await redisClient.del('eggs_cache');
    broadcastMessage({ event: 'egg_deleted', id });

    res.json({ success: true, message: 'Egg deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/** ❌ Centralized Error Handling */
router.use((error, req, res, next) => {
  logger.error(`❌ API Error: ${error.message}`, { error });
  res
    .status(500)
    .json({ success: false, error: error.message || 'Internal Server Error' });
});

export default router;
