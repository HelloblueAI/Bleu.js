const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

module.exports = async () => {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
  }
  
  console.log(`Connecting to MongoDB at ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased timeout
    });
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
