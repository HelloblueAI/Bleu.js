const request = require('supertest');
const mongoose = require('mongoose');

const { startServer, stopServer } = require('../index');

let app, server;

// Define a sample model for testing
const TestModel = mongoose.model(
  'Test',
  new mongoose.Schema({
    name: String,
    value: Number,
  }),
);

beforeAll(async () => {
  ({ app, server } = await startServer(0));
});

afterAll(async () => {
  await stopServer(server);
  await mongoose.connection.dropDatabase();
});

describe('Seed Database', () => {
  it('should seed database successfully', async () => {
    const testData = [
      { name: 'Item 1', value: 10 },
      { name: 'Item 2', value: 20 },
    ];

    const response = await request(app)
      .post('/api/seedDatabase')
      .send({ data: testData, model: 'Test' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'Database seeded successfully',
    );
    expect(response.body).toHaveProperty('insertedCount', 2);

    // Verify data was actually inserted
    const insertedData = await TestModel.find();
    expect(insertedData).toHaveLength(2);
    expect(insertedData[0].name).toBe('Item 1');
    expect(insertedData[1].value).toBe(20);
  });

  it('should handle missing data or model', async () => {
    const response = await request(app).post('/api/seedDatabase').send({});

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing data or model');
  });
});
