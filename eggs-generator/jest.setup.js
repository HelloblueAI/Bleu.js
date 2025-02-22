import { jest } from '@jest/globals';

// 🌎 Global Jest instance
global.jest = jest;

// 🛠️ Mock global functions (if needed)
global.console.error = jest.fn(); // Prevents unnecessary test logs
global.console.warn = jest.fn();
global.console.log = jest.fn();

// 🛠️ Graceful shutdown for async connections (e.g., DB, Redis)
afterAll(async () => {
  if (global.__MONGO_DB__) {
    await global.__MONGO_DB__.stop();
  }
});
