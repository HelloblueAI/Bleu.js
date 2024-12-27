const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bleujs';

const testConnection = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connection successful');

    const AiQuery = mongoose.model(
      'AiQuery',
      new mongoose.Schema({
        query: String,
        response: String,
        createdAt: { type: Date, default: Date.now },
        modelUsed: String,
        confidence: Number,
      }),
    );

    // Insert a document
    const newQuery = new AiQuery({
      query: 'What is the weather?',
      response: 'It is sunny.',
      modelUsed: 'OpenAI GPT-4',
      confidence: 0.98,
    });

    const savedQuery = await newQuery.save();
    console.log('Inserted Document:', savedQuery);

    // Fetch the document
    const result = await AiQuery.find();
    console.log('AiQuery Collection:', result);

    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

testConnection();
