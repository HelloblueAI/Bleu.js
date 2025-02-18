import mongoose from 'mongoose';

import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function testConnection() {
  try {
    console.log(`🔍 Attempting to connect to MongoDB...`);
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Fail fast
    });
    console.log('✅ Successfully connected to MongoDB!');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
