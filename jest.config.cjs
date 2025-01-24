module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Centralized setup for tests

  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/', // Default URL for jsdom environment
    resources: 'usable', // Enable resource loading during tests
    runScripts: 'dangerously', // Allow script execution
  },

  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },

  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'], // Support for different file types

  testMatch: [
    '<rootDir>/tests/**/*.test.(js|jsx|ts|tsx)',
    '<rootDir>/backend/tests/**/*.test.(js|jsx|ts|tsx)',
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/reports/',
    '<rootDir>/build/',
    '<rootDir>/scripts/',
    '<rootDir>/public/',
  ],

  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}', // Include core source files
    'backend/**/*.{js,jsx,ts,tsx}', // Include backend files
    'frontend/**/*.{js,jsx,ts,tsx}', // Include frontend files
    'core-engine/**/*.{js,jsx,ts,tsx}', // Include core engine files
    'language-plugins/**/*.{js,jsx,ts,tsx}', // Include plugins
    '!**/node_modules/**', // Exclude external dependencies
    '!**/dist/**', // Exclude dist directories
    '!**/build/**', // Exclude build directories
    '!**/coverage/**', // Exclude coverage reports
    '!**/reports/**', // Exclude test reports
    '!**/tests/**', // Exclude test files themselves
    '!**/__mocks__/**', // Exclude mock files
    '!**/*.config.{js,ts}', // Exclude config files
    '!**/scripts/**', // Exclude utility scripts
    '!**/public/**', // Exclude static/public assets
    '!**/*.d.ts', // Exclude TypeScript declaration files
  ],
  coverageDirectory: 'coverage', // Directory for coverage reports
  coverageReporters: ['html', 'text', 'lcov'], // Types of coverage reports

  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json', // Use TypeScript config for ts-jest
      diagnostics: false, // Disable TypeScript diagnostics for faster tests
      isolatedModules: true, // Improve performance with isolated modules
    },
  },

  projects: [
    {
      displayName: 'lint', // Lint project
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/**/*.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/reports/'],
    },
    {
      displayName: 'test', // Main test project
      testEnvironment: 'jsdom',
      testEnvironmentOptions: {
        resources: 'usable', // Allow resources to load during tests
      },
      testMatch: [
        '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/backend/tests/**/*.test.{js,jsx,ts,tsx}',
      ],
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/reports/'],
    },
  ],

  watchPlugins: [
    'jest-watch-typeahead/filename', // File name search during watch
    'jest-watch-typeahead/testname', // Test name search during watch
  ],

  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './reports',
        filename: 'test-report.html',
        expand: true,
        pageTitle: 'Bleu.js Test Report',
        hideIcon: false,
        customInfos: [
          { title: 'Project', value: 'Bleu.js' },
          { title: 'Version', value: '1.0.29' },
        ],
        enableMergeData: true, // Merge data from multiple test runs
        includeFailureMsg: true, // Include failure messages in the report
      },
    ],
    [
      'jest-stare',
      {
        resultDir: './reports/jest-stare',
        reportTitle: 'Bleu.js Stare Report',
        coverageLink: '../coverage/lcov-report/index.html', // Link to coverage reports
      },
    ],
  ],

  verbose: true, // Show detailed test output
};
