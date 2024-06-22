const isTestEnv = process.env.NODE_ENV === 'test';

const logger = {
  info: isTestEnv ? jest.fn() : console.info.bind(console),
  warn: isTestEnv ? jest.fn() : console.warn.bind(console),
  error: isTestEnv ? jest.fn() : console.error.bind(console),
};

module.exports = logger;
