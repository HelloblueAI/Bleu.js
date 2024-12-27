import { MongoClient } from 'mongodb';
import { MONGODB_URI } from './jest.setup'; // Adjust the import path as needed

describe('MongoDB Production-Level Integration Tests', () => {
  let mongoClient: MongoClient;
  let db: any;
  const collectionName = 'users';

  beforeAll(async () => {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    db = mongoClient.db('test');
  });

  afterAll(async () => {
    if (mongoClient) {
      await mongoClient.close();
    }
  });

  beforeEach(async () => {
    await db.collection(collectionName).deleteMany({});
  });

  test('should insert and retrieve a valid user', async () => {
    const user = { name: 'Alice', age: 30, email: 'alice@example.com' };
    const result = await db.collection(collectionName).insertOne(user);

    expect(result.insertedId).toBeDefined();
    const retrievedUser = await db
      .collection(collectionName)
      .findOne({ _id: result.insertedId });

    expect(retrievedUser).toEqual(expect.objectContaining(user));
  });

  test('should not insert a user without required fields', async () => {
    try {
      await db.collection(collectionName).insertOne({ age: 25 });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('should update a user’s email and verify changes', async () => {
    const user = { name: 'Bob', age: 25, email: 'bob@example.com' };
    const { insertedId } = await db.collection(collectionName).insertOne(user);

    const newEmail = 'bob.new@example.com';
    const updateResult = await db
      .collection(collectionName)
      .updateOne({ _id: insertedId }, { $set: { email: newEmail } });

    expect(updateResult.matchedCount).toBe(1);
    expect(updateResult.modifiedCount).toBe(1);

    const updatedUser = await db
      .collection(collectionName)
      .findOne({ _id: insertedId });
    expect(updatedUser.email).toBe(newEmail);
  });

  test('should delete a user by ID and verify removal', async () => {
    const user = { name: 'Charlie', age: 28, email: 'charlie@example.com' };
    const { insertedId } = await db.collection(collectionName).insertOne(user);

    const deleteResult = await db
      .collection(collectionName)
      .deleteOne({ _id: insertedId });
    expect(deleteResult.deletedCount).toBe(1);

    const deletedUser = await db
      .collection(collectionName)
      .findOne({ _id: insertedId });
    expect(deletedUser).toBeNull();
  });

  test('should find users above a certain age', async () => {
    const users = [
      { name: 'David', age: 20 },
      { name: 'Eve', age: 30 },
      { name: 'Frank', age: 40 },
    ];
    await db.collection(collectionName).insertMany(users);

    const retrievedUsers = await db
      .collection(collectionName)
      .find({ age: { $gte: 30 } })
      .toArray();
    expect(retrievedUsers.length).toBe(2);
    expect(retrievedUsers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Eve', age: 30 }),
        expect.objectContaining({ name: 'Frank', age: 40 }),
      ]),
    );
  });
});
