import User from '../models/userModel.mjs';
import Rule from '../models/ruleModel.mjs';

const seedDatabase = async () => {
  await User.deleteMany({});
  await Rule.deleteMany({});

  // Seed the User collection
  await User.create({ username: 'testuser', password: 'testpassword' });

  // Seed the Rule collection
  await Rule.create({ type: 'test', name: 'Unit Test', conditions: [], actions: [] });
};

export default seedDatabase;
