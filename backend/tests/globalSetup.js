const mongoose = require('mongoose');

module.exports = async () => {
  // console.log('Connecting to MongoDB');
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  // console.log('Connected to MongoDB');
};
