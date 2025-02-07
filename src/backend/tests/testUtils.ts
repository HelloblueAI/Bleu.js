import { vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Request, Response } from 'express';

export interface MockRequest extends Partial<Request> {
  body?: any;
  query?: any;
  params?: any;
  headers?: any;
}

export interface MockResponse extends Partial<Response> {
  status?: any;
  json?: any;
  send?: any;
}

export const testUtils = {
  db: {
    async connect(): Promise<MongoMemoryServer> {
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      return mongod;
    },

    async disconnect(mongod: MongoMemoryServer): Promise<void> {
      await mongoose.disconnect();
      await mongod.stop();
    },

    async clearDatabase(): Promise<void> {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  },

  mocks: {
    request(overrides: Partial<MockRequest> = {}): MockRequest {
      return {
        body: {},
        query: {},
        params: {},
        headers: {},
        ...overrides
      };
    },

    response(): MockResponse {
      const res: MockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis()
      };
      return res;
    },

    next: vi.fn()
  },

  async closeServer(server: any): Promise<void> {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  }
};

export const mockData = {
  trainingData: [
    {
      outlook: 'sunny',
      temperature: 'hot',
      humidity: 'high',
      windy: false,
      play: 'no'
    },
    {
      outlook: 'overcast',
      temperature: 'mild',
      humidity: 'normal',
      windy: true,
      play: 'yes'
    }
  ]
};

export const cleanupTest = async (server?: any): Promise<void> => {
  await testUtils.db.clearDatabase();
  if (server) {
    await testUtils.closeServer(server);
  }
  vi.clearAllMocks();
};
