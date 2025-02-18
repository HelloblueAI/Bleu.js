const { v4: uuidv4 } = require('uuid');
const Egg = require('../models/egg.schema');

const generateEgg = async (req, res) => {
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
    console.error('Error generating egg:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { generateEgg };

function generateDNA() {
  return require('crypto')
    .createHash('md5')
    .update(Date.now().toString())
    .digest('hex');
}

function calculateDuration(type) {
  const durations = {
    dragon: 259200, // 3 days
    phoenix: 345600, // 4 days
    celestial: 432000, // 5 days
  };
  return durations[type] || 259200;
}
