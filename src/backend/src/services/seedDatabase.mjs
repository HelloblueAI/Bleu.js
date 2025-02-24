import { insertMany } from '../models/RuleModel.mjs';
import { info, error as logError } from '../utils/logger.mjs';

/**
 * Seeds the database with initial data.
 */
export const seedDatabase = async () => {
  const seedData = [
    { name: 'Sample Rule', description: 'This is a sample rule for seeding' },
  ];

  try {
    await insertMany(seedData);
    info('✅ Database seeded successfully');
  } catch (err) {
    logError('❌ Error seeding database:', err);
  }
};
