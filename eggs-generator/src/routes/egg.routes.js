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
import crypto from 'crypto';
import dotenv from 'dotenv';
import Joi from 'joi';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Egg } from '../models/egg.model.js';
import { logger } from '../utils/logger.js';
import { redisClient } from '../utils/redis.js';
import { broadcastMessage } from '../utils/webSocketUtils.js';
import {
  generateDNA,
  calculateInitialPower,

} from '../utils/eggUtils.js';
import { predictEggPrice } from '../utils/aiPricePredictor.js';

import { asyncHandler } from '../utils/asyncHandler.js';
import { hashWithSalt } from '../utils/securityUtils.js';

dotenv.config();

const router = express.Router();
const API_KEY = process.env.API_KEY?.trim();
const CACHE_PREFIX = 'eggs:';
const CACHE_TTL = 300; // 5 minutes

/** 🔒 Secure API Key Middleware */
router.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  

  if (!key || !API_KEY) {
    logger.warn('🔒 Missing API Key', { ip: req.ip, path: req.path });
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }


  try {
    const keyBuffer = Buffer.from(key.trim());
    const apiKeyBuffer = Buffer.from(API_KEY);
    if (!crypto.timingSafeEqual(keyBuffer, apiKeyBuffer)) {
      throw new Error('Invalid API Key');
    }
  } catch (error) {
    logger.error('🔐 Authentication error', { error: error.message, ip: req.ip });
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }


  next();
});

/** 🚀 Rate Limiting */
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 15, // Max requests
  duration: 60, // Per minute
  blockDuration: 30, // Block for 30s if exceeded
  keyPrefix: 'rate-limit-eggs',
});

router.use(async (req, res, next) => {
  try {
    const keyHash = hashWithSalt(`${req.ip}_${req.headers['x-api-key'] || 'nokey'}`);
    await rateLimiter.consume(keyHash);
    next();
  } catch (error) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      retryAfter: Math.ceil(error.msBeforeNext / 1000),
    });
  }
});

/** ✅ Joi Schema Validation */
const eggSchema = Joi.object({
  type: Joi.string().valid('dragon', 'phoenix', 'celestial').required(),
  description: Joi.string().max(500).optional(),
  parameters: Joi.object({
    rarity: Joi.string()
      .valid('common', 'uncommon', 'rare', 'legendary', 'mythical', 'divine', 'unique')
      .required(),
    element: Joi.string()
      .valid('fire', 'water', 'earth', 'air', 'divine', 'shadow', 'void', 'thunder', 'ice')
      .required(),

    power: Joi.number().integer().min(100).max(9999).optional(),

  }).required(),

});

/** 🔄 Retrieve Cached Data */
const getCachedData = async (key) => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

/** 🚀 Fetch All Eggs */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cacheKey = `${CACHE_PREFIX}all_eggs`;

    // Check cache first
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      logger.info('🔄 Cache hit for eggs list');
      return res.json({ success: true, cached: true, eggs: cachedData });
    }

    // Fetch from DB
    const eggs = await Egg.find({})
      .select('-__v')
      .collation({ locale: 'en' })
      .lean();

    // Cache the result
    await redisClient.set(cacheKey, JSON.stringify(eggs), { EX: CACHE_TTL });

    res.json({ success: true, cached: false, eggs });
  }),
);

/** 🔎 Fetch Egg by ID */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cacheKey = `${CACHE_PREFIX}egg_${id}`;

    const cachedEgg = await getCachedData(cacheKey);
    if (cachedEgg) return res.json({ success: true, cached: true, egg: cachedEgg });

    const egg = await Egg.findById(id).select('-__v').lean();
    if (!egg) return res.status(404).json({ success: false, error: 'Egg not found' });

    await redisClient.set(cacheKey, JSON.stringify(egg), { EX: CACHE_TTL });

    res.json({ success: true, cached: false, egg });
  }),
);

/** 🥚 Generate New Egg */
router.post(
  '/generate',
  asyncHandler(async (req, res) => {
    const { error, value } = eggSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details.map((detail) => detail.message),
      });
    }

    const { type, description, parameters } = value;
    const eggId = crypto.randomUUID();


    const dna = generateDNA();


    const powerLevel = calculateInitialPower(parameters.rarity);
    const price = predictEggPrice(parameters.rarity, parameters.element);

    const newEgg = new Egg({
      id: eggId,
      type,
      description: description || `A ${parameters.rarity} ${type} egg`,
      metadata: { ...parameters, dna },
      evolution: { powerLevel },
      market: { price, listed: true, currency: 'gold' },
      createdAt: new Date(),
    });

    await newEgg.save();

    await redisClient.del(`${CACHE_PREFIX}all_eggs`);

    broadcastMessage({ event: 'new_egg', data: { id: newEgg.id, type } });

    res.status(201).json({ success: true, egg: newEgg });
  }),
);

/** ❌ Error Handler */
router.use((error, req, res, next) => {
  logger.error('❌ API Error:', { error: error.message, path: req.path });
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

/** ✅ Health Check */
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Eggs API is running' });
});

export default router;
