const mongoose = require('mongoose');
const AiQuery = require('../models/AiQuery');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bleujs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');

  // Insert a sample document
  const query = new AiQuery({
    query: 'What is AI?',
    response: 'Artificial Intelligence explanation.',
    modelUsed: 'GPT-4',
    confidence: 0.97
  });

  return query.save();
}).then(() => {
  console.log('Document inserted');

  // Retrieve all documents
  return AiQuery.find({});
}).then((docs) => {
  console.log('Retrieved documents:', docs);
  mongoose.connection.close();
}).catch((error) => {
  console.error('Error during MongoDB operations:', error);
  mongoose.connection.close();
});
