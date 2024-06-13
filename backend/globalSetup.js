const mongoose = require('mongoose');
const { seedDatabase } = require('./utils/seedDatabase'); // Assume this file seeds your DB

module.exports = async () => {
  console.log('Global setup before running tests');
  const url = 'mongodb://127.0.0.1/test_database';
  try {
    await mongoose.connect(url);
    await seedDatabase(); // Seed the database
    console.log('Connected to MongoDB and seeded database');
  } catch (error) {
    console.error('Error during global setup:', error);
  }
};
