const Rule = require('../models/ruleModel'); 

const seedDatabase = async () => {
  const data = [
    { name: 'Sample Rule', description: 'This is a sample rule for seeding' },
  ];

  await Rule.insertMany(data);
};

module.exports = { seedDatabase };
