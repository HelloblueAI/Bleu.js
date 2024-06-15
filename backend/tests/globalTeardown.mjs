// globalTeardown.mjs

import mongoose from 'mongoose';

export default async function globalTeardown() {
  console.log('Global teardown after running tests');
  
  try {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
}
