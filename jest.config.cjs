module.exports = {
  // Files to set up testing environment
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test environment configuration
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    resources: 'usable',
  },

  // Transforms to handle various file types
  transform: {
    '^.+\\.jsx?$': 'babel-jest', // JavaScript and JSX files
    '^.+\\.tsx?$': 'ts-jest', // TypeScript and TSX files
  },

  // Recognized file extensions for modules
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],

  // Patterns to identify test files
  testMatch: [
    '<rootDir>/tests/**/*.test.(js|jsx|ts|tsx)',
    '<rootDir>/backend/tests/**/*.test.(js|jsx|ts|tsx)',
  ],

  // Ignore patterns for test files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '<rootDir>/reports/html-report/jest-html-reporters-attach/index/result.js',
    '<rootDir>/reports/jest-html-reporters-attach/test-report/result.js',
    '<rootDir>/reports/jest-html-reporters-attach/test-report/index.js',
  ],

  // Coverage collection settings
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'backend/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],

  // Global configuration for ts-jest
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: false, // Disable diagnostics for better performance during testing
    },
  },

  // Project-specific configurations
  projects: [
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/**/*.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '<rootDir>/reports/html-report/jest-html-reporters-attach/index/result.js',
        '<rootDir>/reports/jest-html-reporters-attach/test-report/result.js',
        '<rootDir>/reports/jest-html-reporters-attach/test-report/index.js',
      ],
    },
    {
      displayName: 'test',
      testEnvironment: 'jsdom',
      testEnvironmentOptions: {}, // Removed unsupported `resources: 'usable'`
      testMatch: [
        '<rootDir>/tests/**/*.test.(js|jsx|ts|tsx)',
        '<rootDir>/backend/tests/**/*.test.(js|jsx|ts|tsx)',
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '<rootDir>/reports/html-report/jest-html-reporters-attach/index/result.js',
        '<rootDir>/reports/jest-html-reporters-attach/test-report/result.js',
        '<rootDir>/reports/jest-html-reporters-attach/test-report/index.js',
      ],
    },
  ],

  // Jest watch mode configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Reporter configurations for enhanced output
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './reports',
        filename: 'test-report.html',
        expand: true,
        pageTitle: 'Test Report',
      },
    ],
  ],

  // Logging level for debugging test runs
  verbose: true,
};
