const mongoose = require('mongoose');
const { logger } = require('../src/utils/logger');

module.exports = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
};
