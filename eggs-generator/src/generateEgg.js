const { v4: uuidv4 } = require('uuid');

/**
 * Generates an egg with the provided options.
 * @param {Object} options - The options for generating the egg.
 * @param {string} options.description - The description of the egg.
 * @param {string} options.type - The type of the egg (e.g., "model", "controller").
 * @param {Object} options.options - Additional options specific to the egg type.
 * @returns {Object} The generated egg.
 */
function generateEgg(options) {
  const { description, type, options: eggOptions } = options;

  if (!description || !type || !eggOptions) {
    throw new Error('Missing required fields: description, type, or options');
  }

  const id = uuidv4();

  const timestamp = new Date().toISOString();

  const egg = {
    id,
    description,
    type,
    options: eggOptions,
    createdAt: timestamp,
  };

  return egg;
}

module.exports = { generateEgg };
