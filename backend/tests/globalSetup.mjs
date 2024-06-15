// globalSetup.mjs

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import seedDatabase from './seedDatabase.mjs'; // Ensure the correct relative path and extension

dotenv.config();

export default async function globalSetup() {
  console.log('Global setup before running tests');
  
  const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/bleujs';

  try {
    // Connect to MongoDB
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Seed the database
    await seedDatabase();

    console.log('Connected to MongoDB and seeded database');
  } catch (error) {
    console.error('Error during global setup:', error);
    process.exit(1); // Exit process if setup fails
  }
}
