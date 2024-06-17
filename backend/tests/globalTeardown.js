// backend/tests/globalTeardown.js
const mongoose = require('mongoose');

module.exports = async () => {
  console.log('Global teardown: Closing environment...');
  await mongoose.disconnect();
  console.log('Global teardown: MongoDB connection closed.');
};
