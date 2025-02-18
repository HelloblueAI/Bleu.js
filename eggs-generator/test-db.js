import mongoose from 'mongoose';

const uri =
  'mongodb://egg-admin:Redmond8665@localhost:27017/eggs-db?authSource=admin';

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connection successful');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
