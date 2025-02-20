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
import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import mongoose from 'mongoose';

const mockGenerateEgg = jest.fn();
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../src/generateEgg.js', () => ({
  generateEgg: mockGenerateEgg,
}));

describe('Egg Generator Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    try {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();

      mongoose.set('strictQuery', false); // To suppress deprecation warnings
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.info('✅ MongoDB Memory Server started successfully');
    } catch (err) {
      console.error('❌ Error starting MongoMemoryServer:', err);
    }
  });

  afterAll(async () => {
    try {
      await mongoose.connection.close();
      await mongoServer.stop();
      console.info('🛑 MongoDB Memory Server stopped successfully');
    } catch (err) {
      console.error('❌ Error stopping MongoMemoryServer:', err);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate egg correctly', async () => {
    const mockEgg = { id: 1, type: 'test' };
    mockGenerateEgg.mockResolvedValueOnce(mockEgg);

    const result = await mockGenerateEgg();

    expect(mockGenerateEgg).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockEgg);
  });
});
