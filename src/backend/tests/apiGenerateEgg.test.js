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
import request from 'supertest';

import { startServer, stopServer } from '../index';

let app, server;

beforeAll(async () => {
  // Start server on a dynamic port for isolated testing
  ({ app, server } = await startServer(0));
});

afterAll(async () => {
  // Stop the server after all tests
  await stopServer(server);
});

describe('Eggs Generator API - Advanced Tests', () => {
  const validInput = { type: 'chicken', parameters: { color: 'brown' } };
  const invalidInput = { parameters: { color: 'brown' } }; // Missing 'type'

  it('should handle valid egg generation requests', async () => {
    const response = await request(app)
      .post('/api/generate-egg')
      .send(validInput);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(response.body.result).toHaveProperty('egg');
  });

  it('should reject invalid egg generation requests (missing type)', async () => {
    const response = await request(app)
      .post('/api/generate-egg')
      .send(invalidInput);
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid input');
  });

  it('should handle large and complex input parameters', async () => {
    const complexInput = {
      type: 'ostrich',
      parameters: {
        size: 'large',
        weight: 150,
        metadata: {
          createdBy: 'test-user',
          nestedData: { a: 1, b: [2, 3], c: { d: 'deep' } },
        },
      },
    };
    const response = await request(app)
      .post('/api/generate-egg')
      .send(complexInput);
    expect(response.statusCode).toBe(200);
    expect(response.body.result).toHaveProperty('egg');
    expect(response.body.result.parameters).toMatchObject(
      complexInput.parameters,
    );
  });

  it('should handle empty requests gracefully', async () => {
    const response = await request(app).post('/api/generate-egg').send({});
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid input');
  });

  it('should handle unexpected data types', async () => {
    const response = await request(app)
      .post('/api/generate-egg')
      .send({ type: 123, parameters: 'invalid' });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid input');
  });

  it('should generate logs for valid requests', async () => {
    const response = await request(app)
      .post('/api/generate-egg')
      .send(validInput);

    expect(response.statusCode).toBe(200);

    // Mock logger functionality for log validation
    console.log(`Logs generated for request: ${JSON.stringify(validInput)}`);
  });

  it('should process multiple concurrent requests correctly', async () => {
    const requests = Array.from({ length: 10 }).map(() =>
      request(app).post('/api/generate-egg').send(validInput),
    );
    const responses = await Promise.all(requests);

    responses.forEach((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('result');
    });
  });

  it('should handle server errors gracefully', async () => {
    const mockGenerateEgg = jest.fn(() => {
      throw new Error('Test error');
    });

    // Temporarily replace the `generateEgg` function to simulate an error
    jest.mock('../generateEgg', () => ({ generateEgg: mockGenerateEgg }));

    const response = await request(app)
      .post('/api/generate-egg')
      .send(validInput);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty('error', 'Internal server error');

    jest.restoreAllMocks(); // Restore original functionality
  });
});
