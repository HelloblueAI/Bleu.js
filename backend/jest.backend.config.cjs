module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  transform: {},
  moduleFileExtensions: ['js', 'json', 'node'],
  verbose: true,
};
