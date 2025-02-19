//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
import { model as _model, Schema, connection } from 'mongoose';
import request from 'supertest';

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
