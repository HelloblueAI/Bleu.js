module.exports = {
  verbose: true,
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json'],
  moduleDirectories: ['node_modules', 'src'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testPathIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/backend/tests/setupTests.js'],
  testSequencer: '<rootDir>/backend/tests/customSequencer.js',
  globalSetup: '<rootDir>/backend/tests/globalSetup.js',
  globalTeardown: '<rootDir>/backend/tests/globalTeardown.js',
  testTimeout: 30000,
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/backend/tests/**/*.test.js'],
      testEnvironment: 'node',
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/frontend/tests/**/*.test.js'],
      testEnvironment: 'jsdom',
      transform: {
        '^.+\\.vue$': 'vue-jest',
        '^.+\\.js$': 'babel-jest',
      },
    },
  ],
};
