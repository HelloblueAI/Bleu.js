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
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { startServer, stopServer } from '../../index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Test Sequencer', () => {
  let server;

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  it('should run tests in sequence', async () => {
    const response = await request(server)
      .post('/api/tests/sequence')
      .send({
        tests: [
          { name: 'test1', command: 'echo "test1"' },
          { name: 'test2', command: 'echo "test2"' }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(2);
    expect(response.body.results[0].name).toBe('test1');
    expect(response.body.results[1].name).toBe('test2');
  });

  it('should handle test failures gracefully', async () => {
    const response = await request(server)
      .post('/api/tests/sequence')
      .send({
        tests: [
          { name: 'test1', command: 'echo "test1"' },
          { name: 'test2', command: 'false' },
          { name: 'test3', command: 'echo "test3"' }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(3);
    expect(response.body.results[1].status).toBe('failed');
  });

  it('should respect test dependencies', async () => {
    const response = await request(server)
      .post('/api/tests/sequence')
      .send({
        tests: [
          { name: 'test1', command: 'echo "test1"' },
          { name: 'test2', command: 'echo "test2"', dependsOn: ['test1'] },
          { name: 'test3', command: 'echo "test3"', dependsOn: ['test2'] }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(3);
    expect(response.body.results[0].name).toBe('test1');
    expect(response.body.results[1].name).toBe('test2');
    expect(response.body.results[2].name).toBe('test3');
  });
});

describe('API Integration Tests', () => {
  it('should return 200 for the basic test endpoint', async () => {
    const response = await request(server).get('/api/basic-test');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Basic test passed');
  });

  it('should return dependencies and outdated modules from /api/dependencies', async () => {
    const response = await request(server).get('/api/dependencies');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('dependencies');
    expect(Array.isArray(response.body.dependencies)).toBe(true);
    expect(response.body).toHaveProperty('outdated');
    expect(Array.isArray(response.body.outdated)).toBe(true);
  });

  it('should resolve and return conflicts from /api/dependencies/conflicts', async () => {
    const response = await request(server).get('/api/dependencies/conflicts');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('resolved');
    expect(Array.isArray(response.body.resolved)).toBe(true);
    expect(response.body).toHaveProperty('conflicts');
    expect(Array.isArray(response.body.conflicts)).toBe(true);
  });

  it('should generate an egg successfully with valid input', async () => {
    const eggOptions = { type: 'chicken', color: 'brown' };
    const response = await request(server)
      .post('/api/generate-egg')
      .send(eggOptions);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('egg');
    expect(response.body.egg).toMatchObject(eggOptions);
  });

  it('should return 400 for invalid egg generation input', async () => {
    const invalidOptions = { type: '', color: 'brown' };
    const response = await request(server)
      .post('/api/generate-egg')
      .send(invalidOptions);
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Invalid input');
  });
});
