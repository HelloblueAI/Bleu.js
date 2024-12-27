/* eslint-env node */
const Rule = require('../models/ruleModel');
const logger = require('../src/utils/logger');

/**
 * Seeds the database with initial data if not already seeded.
 */
const seedDatabase = async () => {
  const data = [
    { name: 'Sample Rule', description: 'This is a sample rule for seeding' },
  ];

  try {
    // Check if the database already contains the data
    const existingRules = await Rule.find({
      name: { $in: data.map((d) => d.name) },
    });

    if (existingRules.length > 0) {
      logger.info('Database already seeded. Skipping seeding process.');
      return;
    }

    // Insert new data into the database
    await Rule.create(data);
    logger.info('Database seeded successfully with the following data:');
    data.forEach((rule) => logger.info(`- ${rule.name}: ${rule.description}`));
  } catch (error) {
    // Log detailed error information
    logger.error('Error seeding the database:', error.message);
  }
};

module.exports = { seedDatabase };
