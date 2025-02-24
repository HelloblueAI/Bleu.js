import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import Egg from '../models/egg.schema.mjs';

/**
 * Generates a new egg with the given parameters.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const generateEgg = async (req, res) => {
  try {
    const { type, description, parameters } = req.body;

    if (!type || !description || !parameters) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validTypes = ['dragon', 'phoenix', 'celestial'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid egg type' });
    }

    const egg = new Egg({
      id: uuidv4(),
      type,
      description,
      metadata: {
        ...parameters,
        dna: generateDNA(),
        generatedBy: 'Eggs-Generator v1.0.37',
      },
      owner: req.user.id,
      status: 'incubating',
      incubationConfig: {
        startTime: new Date(),
        duration: calculateDuration(type),
        temperature: 37,
        optimalTemp: 37,
      },
    });

    await egg.save();
    res.status(201).json(egg);
  } catch (error) {
    console.error('❌ Error generating egg:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Generates a unique DNA hash for an egg.
 * @returns {string} - Generated DNA hash
 */
function generateDNA() {
  return crypto.createHash('md5').update(Date.now().toString()).digest('hex');
}

/**
 * Calculates incubation duration based on egg type.
 * @param {string} type - Egg type
 * @returns {number} - Duration in seconds
 */
function calculateDuration(type) {
  const durations = {
    dragon: 259200, // 3 days
    phoenix: 345600, // 4 days
    celestial: 432000, // 5 days
  };
  return durations[type] || 259200;
}
