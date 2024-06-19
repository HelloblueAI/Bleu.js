const mongoose = require('mongoose');

module.exports = async () => {
  try {
    await mongoose.disconnect();
    console.log('Successfully disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};
