import '@testing-library/jest-dom/extend-expect';

beforeAll(() => {
  console.log('Global setup: Initializing test environment...');
  process.env.TZ = 'UTC';
});


afterEach(() => {
  if (global.server) {
    global.server.close(() => {
      console.log('Server closed after test.');
    });
  }

  
  jest.restoreAllMocks();
  jest.resetModules();
  jest.clearAllMocks();
  jest.clearAllTimers();

  console.log('Test environment cleaned up after test.');
});

afterAll(() => {
  console.log('Global teardown: Finalizing test environment...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  throw reason;
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  throw err;
});
