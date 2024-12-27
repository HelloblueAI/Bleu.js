const mongoose = require('mongoose');

/**
 * @param {string} uri - The connection string for the database
 */
const connect = async (uri) => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed', error);
    throw error;
  }
};

const disconnect = async () => {
  try {
    await mongoose.disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Database disconnection failed', error);
    throw error;
  }
};

module.exports = { connect, disconnect };
