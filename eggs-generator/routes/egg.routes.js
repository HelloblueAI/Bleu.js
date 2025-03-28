import { Router } from 'express';
import { z } from 'zod';
import { Egg } from '../models/egg.model';
import { sanitizeInput } from '../utils/sanitizer';

const router = Router();

// Input validation schema
const eggQuerySchema = z.object({
  type: z.string().optional(),
  rarity: z.string().optional(),
  price: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
});

// Sanitize and validate query parameters
const validateQuery = (req, res, next) => {
  try {
    const sanitizedQuery = sanitizeInput(req.query);
    const validatedQuery = eggQuerySchema.parse(sanitizedQuery);
    req.validatedQuery = validatedQuery;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid query parameters' });
  }
};

// Get eggs with validated query
router.get('/', validateQuery, async (req, res) => {
  try {
    const query = req.validatedQuery;
    
    // Build safe query object
    const safeQuery = {};
    if (query.type) safeQuery.type = query.type;
    if (query.rarity) safeQuery.rarity = query.rarity;
    if (query.price) safeQuery.price = { $lte: query.price };

    // Apply pagination
    const limit = query.limit || 10;
    const offset = query.offset || 0;

    const eggs = await Egg.find(safeQuery)
      .limit(limit)
      .skip(offset)
      .sort({ createdAt: -1 });

    res.json(eggs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ... existing code ... 