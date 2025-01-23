// Import matchers for testing DOM elements
import '@testing-library/jest-dom/extend-expect';

// Set up global variables or configurations before each test
beforeAll(() => {
  console.log('Global setup: Initializing test environment...');
  process.env.TZ = 'UTC'; // Ensure consistent timezone for tests
});

// Clean up resources and restore mocks after each test
afterEach(() => {
  // Close global server if defined
  if (global.server) {
    global.server.close(() => {
      console.log('Server closed after test.');
    });
  }

  // Restore and clear mocks
  jest.restoreAllMocks();
  jest.resetModules();
  jest.clearAllMocks();
  jest.clearAllTimers();

  console.log('Test environment cleaned up after test.');
});

// Clean up or finalize resources after all tests
afterAll(() => {
  console.log('Global teardown: Finalizing test environment...');
  // Add any global cleanup logic if needed
});

// Enhance unhandled promise rejection tracking during tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  throw reason; // Fail the test on unhandled promise rejections
});

// Enhance uncaught exception handling during tests
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  throw err; // Fail the test on uncaught exceptions
});
