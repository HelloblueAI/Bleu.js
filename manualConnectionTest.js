const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  name: String,
});

const TestModel = mongoose.model('Test', testSchema);

async function runTest() {
  try {
    await mongoose.connect(
      'mongodb://bleujsUser:bleujsPassword@localhost:27017/bleujs',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );
    console.log('Successfully connected to MongoDB');

    const testDoc = new TestModel({ name: 'Test Document' });
    await testDoc.save();
    console.log('Document saved:', testDoc);

    const retrievedDoc = await TestModel.findOne({ name: 'Test Document' });
    console.log('Document retrieved:', retrievedDoc);

    await mongoose.disconnect();
    console.log('Successfully disconnected from MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB or performing operations:', err);
  }
}

runTest();
