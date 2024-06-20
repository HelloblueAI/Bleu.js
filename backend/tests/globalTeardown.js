const mongoose = require('mongoose');

module.exports = async () => {
  // console.log('Disconnecting from MongoDB');
  await mongoose.disconnect();
  // console.log('Successfully disconnected from MongoDB');
};
