import request from 'supertest';
import { model as _model, Schema, connection } from 'mongoose';

import { startServer, stopServer } from '../index';

let app, server;

const TestModel = _model(
  'Test',
  new Schema({
    name: String,
    value: Number,
  }),
);

beforeAll(async () => {
  ({ app, server } = await startServer(0));
});

afterAll(async () => {
  await stopServer(server);
  await connection.dropDatabase();
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
