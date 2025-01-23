/* eslint-env node */
import { insertMany } from '../models/RuleModel';
import { info, error as _error } from '../src/utils/logger';

const seedDatabase = async () => {
  const data = [
    { name: 'Sample Rule', description: 'This is a sample rule for seeding' },
  ];

  try {
    await insertMany(data);
    info('Database seeded successfully');
  } catch (error) {
    _error('Error seeding database:', error);
  }
};

export default { seedDatabase };
