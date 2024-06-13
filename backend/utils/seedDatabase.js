const User = require('../models/userModel');
const Rule = require('../models/ruleModel');

const seedDatabase = async () => {
  await User.deleteMany({});
  await Rule.deleteMany({});

  
  await User.create({ username: 'testuser', password: 'testpassword' });

  
  await Rule.create({ type: 'test', name: 'Unit Test', conditions: [], actions: [] });
};

module.exports = { seedDatabase };
