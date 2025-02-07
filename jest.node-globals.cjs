// jest.node-globals.cjs

// Import modules early
const { TextEncoder, TextDecoder } = require('util');

// Set up globals
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.Buffer = global.Buffer || require('buffer').Buffer;
global.process = global.process || require('process');

// ✅ Do NOT mock built-in Node.js modules (fs, path, async_hooks)

// ✅ Mock only external dependencies
jest.mock('mongoose', () => {
  const mockMongoose = jest.requireActual('mongoose');
  return {
    ...mockMongoose,
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => Promise.resolve()),
    model: jest.fn(),
  };
});

jest.mock('supertest', () => jest.requireActual('supertest'));
jest.mock('formidable', () => jest.requireActual('formidable'));
