/* eslint-env node */
const Rule = require('../models/ruleModel');
const logger = require('../src/utils/logger'); // Ensure logger is defined

const seedDatabase = async () => {
  const data = [
    { name: 'Sample Rule', description: 'This is a sample rule for seeding' },
  ];

  try {
    await Rule.insertMany(data);
    logger.info('Database seeded successfully');
  } catch (error) {
    logger.error('Error seeding database:', error);
  }
};

module.exports = { seedDatabase };
