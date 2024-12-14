import '@testing-library/jest-dom/extend-expect';

// Set the MongoDB URI for tests
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/test-bleujs';
console.log('Using MongoDB URI for tests:', MONGODB_URI);

if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('text-encoding').TextEncoder;
  global.TextDecoder = require('text-encoding').TextDecoder;
}

afterEach(() => {
  if (global.server) {
    global.server.close(() => {
      console.log('Server closed after test suite.');
    });
  }

  jest.restoreAllMocks();
  jest.resetModules();
  jest.clearAllMocks();
  jest.clearAllTimers();
});

export { MONGODB_URI };
