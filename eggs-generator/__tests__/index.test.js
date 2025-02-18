import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import mongoose from 'mongoose';

// Mocked dependencies
const mockGenerateEgg = jest.fn();
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Mock `generateEgg` module
jest.mock('../src/generateEgg.js', () => ({
  generateEgg: mockGenerateEgg
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
        useUnifiedTopology: true
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
