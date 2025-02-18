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
            }
            catch (error) {
                console.error('Database connection failed:', error);
                throw error;
            }
        },
        async disconnect(mongod) {
            try {
                await mongoose.connection.dropDatabase();
                await mongoose.disconnect();
                await mongod.stop();
            }
            catch (error) {
                console.error('Error during database disconnection:', error);
            }
        },
        async clearDatabase() {
            try {
                const collections = mongoose.connection.collections;
                await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
            }
            catch (error) {
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
