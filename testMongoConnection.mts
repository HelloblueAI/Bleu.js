import { MongoClient } from 'mongodb'; // Removed 'Db' from import

async function connectToDatabase() {
  const uri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/bleujs';
  let client: MongoClient | undefined;

  try {
    client = new MongoClient(uri);
    await client.connect();

    console.log('Connected to MongoDB');
    const db = client.db('bleujs');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return null;
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

connectToDatabase().catch((error) => {
  console.error('Unhandled error:', error);
});
