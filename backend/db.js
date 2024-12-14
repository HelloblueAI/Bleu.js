const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bleujs',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Stop the server if database connection fails
  }
};

module.exports = connectDB;
