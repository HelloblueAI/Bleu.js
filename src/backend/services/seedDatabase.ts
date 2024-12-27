import Rule from '../models/ruleModel.js';
import logger from '../src/utils/logger.js';

const seedDatabase = async (): Promise<void> => {
  try {
    // Fetch existing rules from the database
    const existingRules = await Rule.find();

    if (existingRules.length === 0) {
      // Seed the database with initial data
      await Rule.create({
        name: 'Example Rule',
        data: 'Sample data for the rule',
        nested: { level1: { level2: 'Nested data example' } },
      });
      logger.info('Database seeded successfully');
    } else {
      logger.info('Database already seeded');
    }
  } catch (error) {
    logger.error('Error seeding database:', error);
  }
};

export default seedDatabase;
