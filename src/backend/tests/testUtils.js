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

import { vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
export const testUtils = {
  db: {
    async connect() {
      try {
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri, { dbName: 'test-db' });
        return { mongod, uri };
      } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
      }
    },
    async disconnect(mongod) {
      try {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
        await mongod.stop();
      } catch (error) {
        console.error('Error during database disconnection:', error);
      }
    },
    async clearDatabase() {
      try {
        const collections = mongoose.connection.collections;
        await Promise.all(
          Object.values(collections).map((collection) =>
            collection.deleteMany({}),
          ),
        );
      } catch (error) {
        console.error('Error clearing database:', error);
      }
    },
  },
  mocks: {
    request(overrides = {}) {
      return {
        body: {},
        query: {},
        params: {},
        headers: {},
        ...overrides,
      };
    },
    response() {
      return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      };
    },
    next: vi.fn(),
  },
  async closeServer(server) {
    if (server && typeof server.close === 'function') {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  },
};
export const mockData = {
  trainingData: Object.freeze([
    {
      outlook: 'sunny',
      temperature: 'hot',
      humidity: 'high',
      windy: false,
      play: 'no',
    },
    {
      outlook: 'overcast',
      temperature: 'mild',
      humidity: 'normal',
      windy: true,
      play: 'yes',
    },
  ]),
};
export const cleanupTest = async (server) => {
  await testUtils.db.clearDatabase();
  if (server) {
    await testUtils.closeServer(server);
  }
  vi.clearAllMocks();
};
