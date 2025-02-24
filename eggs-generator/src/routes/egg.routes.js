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
import { Egg } from '../models/egg.model.js';
import { logger } from '../utils/logger.js';
import { redisClient } from '../utils/redis.js';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { MARKET_CONFIG } from '../config/marketConfig.js';
import {
  generateDNA,
  calculateInitialPower,
  validateEggMetadata,
} from '../utils/eggUtils.js';
import { predictEggPrice } from '../utils/aiPricePredictor.js';
import { broadcastMessage } from '../utils/webSocketUtils.js';
import Joi from 'joi';
import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashWithSalt } from '../utils/securityUtils.js';

dotenv.config();
const router = express.Router();

// Configuration constants
const CONFIG = Object.freeze({
  CACHE: {
    DEFAULT_TTL: 300, // 5 minutes in seconds
    LONG_TTL: 3600, // 1 hour in seconds
    PREFIX: 'eggs:', // Cache key prefix
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
  RATE_LIMIT: {
    POINTS: 15, // Requests per duration
    DURATION: 60, // Duration in seconds
    BLOCK_DURATION: 30, // Block duration in seconds
  },
  SECURITY: {
    QUERY_WHITELIST: {
      TYPES: Object.freeze(['dragon', 'phoenix', 'celestial']),
      RARITIES: Object.freeze([
        'common',
        'uncommon',
        'rare',
        'legendary',
        'mythical',
        'divine',
        'unique',
      ]),
      SORT_FIELDS: Object.freeze([
        'createdAt',
        'type',
        'metadata.rarity',
        'market.price',
        'metadata.generation',
      ]),
      SORT_ORDERS: Object.freeze(['asc', 'desc']),
      STATUSES: Object.freeze([
        'created',
        'incubating',
        'hatching',
        'hatched',
        'evolving',
        'dormant',
      ]),
      ELEMENTS: Object.freeze([
        'fire',
        'water',
        'earth',
        'air',
        'divine',
        'shadow',
        'void',
        'thunder',
        'ice',
      ]),
      SIZES: Object.freeze(['tiny', 'small', 'medium', 'large', 'massive']),
      TIERS: Object.freeze(['FREE', 'PRO', 'ENTERPRISE']),
      CURRENCIES: Object.freeze(['gold', 'gems', 'ether', 'tokens']),
    },
  },
});

/** 🛠 Apply JSON Response Headers Middleware */
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

/** 🔐 API Key Authentication with Advanced Security */
router.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  const apiKey = process.env.API_KEY?.trim();

  if (!key || !apiKey) {
    logger.warn('🔒 Authentication failure: Missing credentials', {
      ip: req.ip,
      path: req.path,
    });

    return res
      .status(403)
      .json({
        success: false,
        error: 'Unauthorized. Valid API Key is required.',
      });
  }

  // Safely compare API keys using constant-time comparison
  try {
    const keyBuffer = Buffer.from(key.trim());
    const apiKeyBuffer = Buffer.from(apiKey);

    if (!crypto.timingSafeEqual(keyBuffer, apiKeyBuffer)) {
      logger.warn('🔒 Authentication failure: Invalid credentials', {
        ip: req.ip,
        path: req.path,
      });

      return res
        .status(403)
        .json({
          success: false,
          error: 'Unauthorized. Valid API Key is required.',
        });
    }
  } catch (error) {
    // Handle potential errors in comparison
    logger.error('🔒 Authentication error', {
      error: error.message,
      ip: req.ip,
      path: req.path,
    });

    return res
      .status(403)
      .json({ success: false, error: 'Unauthorized. Authentication failed.' });
  }

  logger.info('✅ API Key authenticated', {
    ip: req.ip,
    path: req.path,
  });

  next();
});

/** 🚀 Dynamic Rate Limiting with IP and API Key tracking */
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: CONFIG.RATE_LIMIT.POINTS,
  duration: CONFIG.RATE_LIMIT.DURATION,
  blockDuration: CONFIG.RATE_LIMIT.BLOCK_DURATION,
  keyPrefix: 'rate-limit-eggs',
});

router.use(async (req, res, next) => {
  try {
    // Create a consistent identifier for rate limiting that doesn't expose the full API key
    const keyHash = hashWithSalt(
      `${req.ip}_${req.headers['x-api-key'] || 'nokey'}`,
    );

    await rateLimiter.consume(keyHash);
    next();
  } catch (error) {
    // If rate limit exceeded, return 429 with retry information
    const retryAfter =
      Math.ceil(error.msBeforeNext / 1000) || CONFIG.RATE_LIMIT.BLOCK_DURATION;

    logger.warn(`⚠️ Rate limit exceeded`, {
      ip: req.ip,
      path: req.path,
      retryAfter,
    });

    return res
      .status(429)
      .setHeader('Retry-After', retryAfter.toString())
      .json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter,
      });
  }
});

/** ✅ Joi Schema Validation with Enhanced Security */
const createEggSchema = Joi.object({
  type: Joi.string()
    .valid(...CONFIG.SECURITY.QUERY_WHITELIST.TYPES)
    .required()
    .trim(),
  description: Joi.string()
    .max(500)
    .optional()
    .trim()
    .pattern(/^[a-zA-Z0-9\s.,!?:;'"()-]+$/)
    .messages({
      'string.pattern.base': 'Description contains invalid characters',
    }),
  parameters: Joi.object({
    rarity: Joi.string()
      .valid(...CONFIG.SECURITY.QUERY_WHITELIST.RARITIES)
      .required(),
    element: Joi.string()
      .valid(...CONFIG.SECURITY.QUERY_WHITELIST.ELEMENTS)
      .required(),
    size: Joi.string()
      .valid(...CONFIG.SECURITY.QUERY_WHITELIST.SIZES)
      .optional(),
    power: Joi.number().integer().min(100).max(9999).optional(),
    tags: Joi.array()
      .items(
        Joi.string()
          .trim()
          .pattern(/^[a-zA-Z0-9\-_]+$/)
          .max(30),
      )
      .max(10)
      .optional(),
  }).required(),
  tier: Joi.string()
    .valid(...CONFIG.SECURITY.QUERY_WHITELIST.TIERS)
    .default('FREE'),
});

/**
 * Safely creates a cache key from validated parameters
 * @param {Object} params - Validated parameters
 * @returns {String} Sanitized cache key
 */
function createCacheKey(params) {
  // Extract and validate parameters
  const page = Math.max(
    1,
    parseInt(params.page, 10) || CONFIG.PAGINATION.DEFAULT_PAGE,
  );
  const limit = Math.min(
    CONFIG.PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(params.limit, 10) || CONFIG.PAGINATION.DEFAULT_LIMIT),
  );

  // Determine type value - only use if it's in the whitelist
  let typeValue = 'all';
  if (
    params.type &&
    CONFIG.SECURITY.QUERY_WHITELIST.TYPES.includes(params.type)
  ) {
    typeValue = params.type;
  }

  // Determine rarity value - only use if it's in the whitelist
  let rarityValue = 'all';
  if (
    params.rarity &&
    CONFIG.SECURITY.QUERY_WHITELIST.RARITIES.includes(params.rarity)
  ) {
    rarityValue = params.rarity;
  }

  // Handle boolean parameters safely
  let listedValue = 'all';
  if (params.listed === 'true' || params.listed === 'false') {
    listedValue = params.listed;
  }

  // Create a safe, deterministic cache key
  return `${CONFIG.CACHE.PREFIX}list_p${page}_l${limit}_t${typeValue}_r${rarityValue}_m${listedValue}`;
}

/**
 * Safely validates and sanitizes query parameters
 * @param {Object} queryParams - Raw query parameters from request
 * @returns {Object} Sanitized parameters
 */
function sanitizeQueryParams(queryParams) {
  // Extract parameters with defaults
  const {
    page = CONFIG.PAGINATION.DEFAULT_PAGE,
    limit = CONFIG.PAGINATION.DEFAULT_LIMIT,
    sort = 'createdAt',
    order = 'desc',
    type,
    rarity,
    listed,
    includeTotal = 'true',
  } = queryParams;

  // Sanitize pagination parameters
  const sanitizedPage = Math.max(
    1,
    parseInt(page, 10) || CONFIG.PAGINATION.DEFAULT_PAGE,
  );
  const sanitizedLimit = Math.min(
    CONFIG.PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(limit, 10) || CONFIG.PAGINATION.DEFAULT_LIMIT),
  );

  // Sanitize sort field
  const sanitizedSort = CONFIG.SECURITY.QUERY_WHITELIST.SORT_FIELDS.includes(
    sort,
  )
    ? sort
    : 'createdAt'; // Default sort

  // Sanitize sort order
  let sanitizedOrder;
  if (order === 'asc') {
    sanitizedOrder = 1;
  } else {
    sanitizedOrder = -1; // Default to descending
  }

  // Only include total count if specifically requested
  const shouldIncludeTotal = includeTotal === 'true';

  return {
    sanitizedPage,
    sanitizedLimit,
    sanitizedSort,
    sanitizedOrder,
    type,
    rarity,
    listed,
    shouldIncludeTotal,
  };
}

/**
 * Builds a safe MongoDB query object from validated inputs
 * @param {string} type - Egg type filter
 * @param {string} rarity - Egg rarity filter
 * @param {string} listed - Market listing filter
 * @returns {Object} Safe MongoDB query object
 */
function buildSafeQuery(type, rarity, listed) {
  const query = {};

  // Only add field if it's in the allowed list
  if (type && CONFIG.SECURITY.QUERY_WHITELIST.TYPES.includes(type)) {
    query.type = type;
  }

  // Only add field if it's in the allowed list
  if (rarity && CONFIG.SECURITY.QUERY_WHITELIST.RARITIES.includes(rarity)) {
    query['metadata.rarity'] = rarity;
  }

  // Handle boolean parameter safely
  if (listed === 'true') {
    query['market.listed'] = true;
  } else if (listed === 'false') {
    query['market.listed'] = false;
  }

  return query;
}

/**
 * Executes a MongoDB query with sanitized parameters
 * @param {Object} query - Validated MongoDB query
 * @param {string} sortField - Validated sort field
 * @param {number} sortOrder - Validated sort order (1 or -1)
 * @param {number} page - Validated page number
 * @param {number} limit - Validated page size
 * @returns {Promise<Array>} Query results
 */
async function executeSafeQuery(query, sortField, sortOrder, page, limit) {
  // Create a safe sort object
  const sortObj = {};
  sortObj[sortField] = sortOrder;

  // Calculate skip value
  const skip = (page - 1) * limit;

  // Execute the query with sanitized parameters
  return await Egg.find(query)
    .collation({ locale: 'en' })
    .select('-__v -_id')
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
}

/** 🔍 Fetch Eggs (⚡ Cached, Paginated & Filtered) */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Sanitize query parameters
    const {
      sanitizedPage,
      sanitizedLimit,
      sanitizedSort,
      sanitizedOrder,
      type,
      rarity,
      listed,
      shouldIncludeTotal,
    } = sanitizeQueryParams(req.query);

    // Build safe MongoDB query
    const query = buildSafeQuery(type, rarity, listed);

    // Create deterministic cache key from sanitized parameters
    const cacheKey = createCacheKey({
      page: sanitizedPage,
      limit: sanitizedLimit,
      type,
      rarity,
      listed,
    });

    // Try to retrieve from cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      logger.info('🔄 Cache hit for eggs query', { cacheKey });

      return res.json({
        success: true,
        cached: true,
        pagination: parsedData.pagination,
        eggs: parsedData.eggs,
      });
    }

    // Execute query with sanitized parameters
    const eggs = await executeSafeQuery(
      query,
      sanitizedSort,
      sanitizedOrder,
      sanitizedPage,
      sanitizedLimit,
    );

    // Only count total if needed (can be expensive operation)
    let total = 0;
    let pages = 0;

    if (shouldIncludeTotal) {
      total = await Egg.countDocuments(query);
      pages = Math.ceil(total / sanitizedLimit);
    } else {
      // Just check if there's a next page by looking for one more document
      const hasMorePages = await Egg.exists(query)
        .skip(sanitizedPage * sanitizedLimit)
        .limit(1);

      pages = hasMorePages ? sanitizedPage + 1 : sanitizedPage;
    }

    const pagination = {
      page: sanitizedPage,
      limit: sanitizedLimit,
      total,
      pages,
      hasMorePages: sanitizedPage < pages,
    };

    const responseData = {
      success: true,
      cached: false,
      pagination,
      eggs,
    };

    // Cache results
    await redisClient.set(
      cacheKey,
      JSON.stringify({
        pagination,
        eggs,
      }),
      {
        EX: CONFIG.CACHE.DEFAULT_TTL,
        NX: true,
      },
    );

    logger.info('🔍 Eggs fetched successfully', {
      count: eggs.length,
      page: sanitizedPage,
      filters: Object.keys(query).length ? query : 'none',
    });

    res.json(responseData);
  }),
);

/** 🔍 Fetch Egg by ID */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate ID format to prevent injection
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    if (!isValidObjectId && !isValidUUID) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format',
      });
    }

    // Try to get from cache first
    const cacheKey = `${CONFIG.CACHE.PREFIX}egg_${id}`;
    const cachedEgg = await redisClient.get(cacheKey);

    if (cachedEgg) {
      return res.json({
        success: true,
        cached: true,
        egg: JSON.parse(cachedEgg),
      });
    }

    // Prepare a safe query based on ID format
    let egg;

    if (isValidObjectId) {
      egg = await Egg.findById(id).select('-__v').lean();
    } else {
      egg = await Egg.findOne({ id }).select('-__v').lean();
    }

    if (!egg) {
      return res.status(404).json({
        success: false,
        error: 'Egg not found',
      });
    }

    // Cache the result
    await redisClient.set(cacheKey, JSON.stringify(egg), {
      EX: CONFIG.CACHE.DEFAULT_TTL,
      NX: true,
    });

    res.json({
      success: true,
      cached: false,
      egg,
    });
  }),
);

/** 🚀 Generate Egg with AI Pricing */
router.post(
  '/generate-egg',
  asyncHandler(async (req, res) => {
    // Validate request against schema
    const { error, value } = createEggSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    const { type, description, parameters, tier } = value;

    // Validate tier against available tiers
    const tierConfig = MARKET_CONFIG.TIERS[tier];
    if (!tierConfig) {
      return res.status(403).json({
        success: false,
        error: 'Invalid tier',
        availableTiers: Object.keys(MARKET_CONFIG.TIERS),
      });
    }

    // Use AI to predict egg price based on characteristics
    const price = predictEggPrice(
      parameters.rarity,
      parameters.element,
      parameters.size,
    );

    // Generate secure UUID for the egg
    const eggId = crypto.randomUUID();

    // Generate secure DNA sequence
    const dna = generateDNA();

    // Calculate initial power based on rarity
    const powerLevel = calculateInitialPower(parameters.rarity);

    // Create egg with calculated properties
    const egg = new Egg({
      id: eggId,
      type,
      description: description || `A ${parameters.rarity} ${type} egg`,
      metadata: {
        properties: parameters,
        rarity: parameters.rarity,
        dna,
        createdAt: new Date(),
        tags: parameters.tags || [],
      },
      status: 'incubating',
      evolution: {
        stage: 1,
        powerLevel,
      },
      market: {
        listed: true,
        price,
        currency: tierConfig.defaultCurrency || 'gold',
        listDate: new Date(),
      },
      owner: req.headers['x-user-id'] || 'system',
      incubationConfig: {
        startTime: new Date(),
        duration: tierConfig.incubationTime || 86400000, // Default to 24 hours
        temperature: determineIncubationTemperature(parameters.element),
        conditions: determineIncubationConditions(parameters.element),
      },
    });

    // Validate egg metadata
    const metadataValidation = validateEggMetadata(egg.metadata);
    if (!metadataValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid egg metadata',
        details: metadataValidation.errors,
      });
    }

    // Save the egg to database
    await egg.save();

    // Invalidate related caches
    await clearRelatedCaches();

    // Broadcast real-time update to connected clients
    broadcastMessage({
      event: 'new_egg',
      data: {
        id: egg.id,
        type: egg.type,
        rarity: egg.metadata.rarity,
        element: egg.metadata.properties.element,
        price: egg.market.price,
      },
    });

    logger.info('🥚 New egg generated', {
      id: egg.id,
      type,
      rarity: parameters.rarity,
      element: parameters.element,
    });

    res.status(201).json({
      success: true,
      result: egg,
      market: {
        tier: tierConfig,
        tradingEnabled: tier !== 'FREE',
        estimatedHatchTime: new Date(
          Date.now() + egg.incubationConfig.duration,
        ),
      },
    });
  }),
);

/**
 * Determines the appropriate incubation temperature based on element
 * @param {string} element - Egg element
 * @returns {number} Optimal temperature
 */
function determineIncubationTemperature(element) {
  switch (element) {
    case 'fire':
      return 45;
    case 'water':
      return 15;
    case 'ice':
      return 5;
    case 'earth':
      return 25;
    case 'air':
      return 20;
    case 'divine':
      return 37;
    case 'shadow':
      return 10;
    case 'void':
      return 0;
    case 'thunder':
      return 40;
    default:
      return 30;
  }
}

/**
 * Determines the appropriate incubation conditions based on element
 * @param {string} element - Egg element
 * @returns {Array<string>} Incubation conditions
 */
function determineIncubationConditions(element) {
  // Map elements to appropriate incubation conditions
  const conditionMap = {
    fire: ['warm', 'bright'],
    water: ['humid', 'dark'],
    earth: ['humid', 'warm'],
    air: ['dry', 'bright'],
    divine: ['bright', 'mystical'],
    shadow: ['dark', 'mystical'],
    void: ['dark', 'cold'],
    thunder: ['electrified', 'bright'],
    ice: ['cold', 'bright'],
  };

  return conditionMap[element] || ['warm', 'bright'];
}

/**
 * Clears all related egg caches
 */
async function clearRelatedCaches() {
  // Find and delete all egg list cache keys
  const listCachePattern = `${CONFIG.CACHE.PREFIX}list_*`;
  const listCacheKeys = await redisClient.keys(listCachePattern);

  if (listCacheKeys.length > 0) {
    await redisClient.del(listCacheKeys);
  }
}

/** 🔥 Delete Egg */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate ID format
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    if (!isValidObjectId && !isValidUUID) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format',
      });
    }

    // Find egg using the appropriate query
    let egg;

    if (isValidObjectId) {
      egg = await Egg.findById(id);
    } else {
      egg = await Egg.findOne({ id });
    }

    if (!egg) {
      return res.status(404).json({
        success: false,
        error: 'Egg not found',
      });
    }

    // Check ownership if applicable
    const requestUserId = req.headers['x-user-id'];
    if (
      requestUserId &&
      egg.owner !== requestUserId &&
      !req.headers['x-admin-access']
    ) {
      logger.warn('⚠️ Unauthorized delete attempt', {
        eggId: id,
        requestUserId,
        ownerUserId: egg.owner,
      });

      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this egg',
      });
    }

    // Delete the egg
    await egg.remove();

    // Clear caches
    await clearRelatedCaches();
    await redisClient.del(`${CONFIG.CACHE.PREFIX}egg_${id}`);

    // Broadcast deletion
    broadcastMessage({
      event: 'egg_deleted',
      data: { id: egg.id },
    });

    logger.info('🗑️ Egg deleted', { id: egg.id });

    res.json({
      success: true,
      message: 'Egg deleted successfully',
      id: egg.id,
    });
  }),
);

/** ❌ Centralized Error Handling */
router.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const errorMessage = error.message || 'Internal Server Error';

  logger.error('❌ API Error:', {
    error: errorMessage,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Security-focused error responses
  const errorResponse = {
    success: false,
    error: errorMessage,
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
});

export default router;
