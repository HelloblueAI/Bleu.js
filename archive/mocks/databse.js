const mongoose = require('mongoose');

const config = require('../config');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    if (this.connection) return this.connection;

    try {
      this.connection = await mongoose.connect(config.mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB');
      return this.connection;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      console.log('Disconnected from MongoDB');
    }
  }

  async seed(data, model) {
    if (!this.connection) {
      await this.connect();
    }
    const result = await model.insertMany(data);
    return { insertedCount: result.length };
  }
}

module.exports = new Database();
