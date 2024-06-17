const mongoose = require('mongoose');
const Rule = require('../models/ruleModel');

const seedData = [
  { name: 'Sample Rule 1', conditions: ['data.type === "sample"'], actions: ['return "Sample 1"'] },
  { name: 'Sample Rule 2', conditions: ['data.type === "example"'], actions: ['return "Example 2"'] },
];

module.exports = async () => {
  console.log('Seeding database...');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bleujs';
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await Rule.deleteMany({});
  await Rule.insertMany(seedData);
  
  await mongoose.disconnect();
  console.log('Database seeded successfully.');
};

test('seed database', async () => {
  await require('./seedDatabase.test.js')();
  expect(true).toBe(true);
});
