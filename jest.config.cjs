module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    resources: 'usable',  // Keeps this option
  },
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  testMatch: [
    '<rootDir>/tests/**/*.test.(js|jsx|ts|tsx)',
    '<rootDir>/backend/tests/**/*.test.(js|jsx|ts|tsx)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'backend/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  // Removing testEnvironmentOptions from the 'projects' array
  projects: [
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/**/*.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    },
    {
      displayName: 'test',
      testEnvironment: 'jsdom',  // Use jsdom without custom options
      testMatch: [
        '<rootDir>/tests/**/*.test.(js|jsx|ts|tsx)',
        '<rootDir>/backend/tests/**/*..test.(js|jsx|ts|tsx)',
      ],
      testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    },
  ],
};
