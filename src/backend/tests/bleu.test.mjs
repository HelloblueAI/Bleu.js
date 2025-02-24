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
import { startServer, stopServer } from '../index.mjs'; // Ensure correct `.mjs` import

let app, server;

beforeAll(async () => {
  ({ app, server } = await startServer(0));
});

afterAll(async () => {
  await stopServer(server);
});

describe('🟦 Bleu.js API Test Suite', () => {
  it('✅ Should pass a basic test', async () => {
    const response = await request(app).get('/api/basic-test');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Basic test passed');
  });

  it('🔄 Should handle JSON responses properly', async () => {
    const response = await request(app).get('/api/json-test');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'JSON test passed');
  });

  it('🚫 Should return 404 for non-existent routes', async () => {
    const response = await request(app).get('/api/nonexistent-route');
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error', 'Not Found');
  });

  it('⚠️ Should handle server errors gracefully', async () => {
    const mockErrorRoute = '/api/error-simulation';
    const response = await request(app).get(mockErrorRoute);
    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty('error', 'Internal Server Error');
  });

  it('🔄 Should handle multiple concurrent requests', async () => {
    const requests = Array.from({ length: 5 }).map(() =>
      request(app).get('/api/basic-test'),
    );
    const responses = await Promise.all(requests);
    responses.forEach((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('Basic test passed');
    });
  });
});
