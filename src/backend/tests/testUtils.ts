import { vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Request, Response, NextFunction } from 'express';

export interface MockRequest extends Partial<Request> {
  body?: Record<string, any>;
  query?: Record<string, any>;
  params?: Record<string, any>;
  headers?: Record<string, any>;
}

export interface MockResponse extends Partial<Response> {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
}

export const testUtils = {
  db: {
    async connect(): Promise<{ mongod: InstanceType<typeof MongoMemoryServer>; uri: string }> {
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

    async disconnect(mongod: InstanceType<typeof MongoMemoryServer>): Promise<void> {
      try {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
        await mongod.stop();
      } catch (error) {
        console.error('Error during database disconnection:', error);
      }
    },

    async clearDatabase(): Promise<void> {
      try {
        const collections = mongoose.connection.collections;
        await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
      } catch (error) {
        console.error('Error clearing database:', error);
      }
    },
  },

  mocks: {
    request(overrides: Partial<MockRequest> = {}): MockRequest {
      return {
        body: {},
        query: {},
        params: {},
        headers: {},
        ...overrides,
      };
    },

    response(): MockResponse {
      return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      };
    },

    next: vi.fn() as NextFunction,
  },

  async closeServer(server?: any): Promise<void> {
    if (server && typeof server.close === 'function') {
      await new Promise<void>((resolve, reject) => {
        server.close((error?: Error) => (error ? reject(error) : resolve()));
      });
    }
  },
};

export const mockData = {
  trainingData: Object.freeze([
    { outlook: 'sunny', temperature: 'hot', humidity: 'high', windy: false, play: 'no' },
    { outlook: 'overcast', temperature: 'mild', humidity: 'normal', windy: true, play: 'yes' },
  ]),
};

export const cleanupTest = async (server?: any): Promise<void> => {
  await testUtils.db.clearDatabase();
  if (server) {
    await testUtils.closeServer(server);
  }
  vi.clearAllMocks();
};
