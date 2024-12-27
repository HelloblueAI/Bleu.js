import { ruleModel } from '../models/ruleModel.js';
import logger from '../src/utils/logger.js';

const seedDatabase = async () => {
  try {
    const existingRules = await ruleModel.find();
    if (existingRules.length === 0) {
      await ruleModel.create({ /* your data */ });
      logger.info('Database seeded successfully');
    } else {
      logger.info('Database already seeded');
    }
  } catch (error) {
    logger.error('Error seeding database:', error);
  }
};

export default seedDatabase;
