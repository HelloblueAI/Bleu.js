module.exports = {
  // Auto-run setup after environment initialization
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Optimized testing environment
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/',
    resources: 'usable',
    runScripts: 'dangerously',
  },

  // Smart transpilation using Babel and ts-jest
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: false,
        isolatedModules: true,
        esModuleInterop: true,
      },
    ],
  },

  // File extensions Jest should recognize
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node', 'mjs', 'cjs'],

  // Test file patterns to match
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/backend/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/frontend/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/core-engine/tests/**/*.test.{js,jsx,ts,tsx}',
  ],

  // Ignore unnecessary paths for better performance
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '/reports/', '<rootDir>/build/', '<rootDir>/scripts/', '<rootDir>/public/'],

  // 🔥 Collect coverage from source files only (fixes 0% coverage issue)
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'backend/src/**/*.{js,jsx,ts,tsx}',
    'frontend/src/**/*.{js,jsx,ts,tsx}',
    'core-engine/src/**/*.{js,jsx,ts,tsx}',
    'language-plugins/src/**/*.{js,jsx,ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov', 'json-summary'],

  // Projects for better test organization
  projects: [
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/**/*.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/reports/'],
    },
    {
      displayName: 'test',
      testEnvironment: 'jsdom',
      testEnvironmentOptions: { resources: 'usable' },
      testMatch: [
        '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/backend/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/frontend/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/core-engine/tests/**/*.test.{js,jsx,ts,tsx}',
      ],
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/reports/'],
    },
  ],

  // Smart testing enhancements
  automock: false, // Prevents Jest from auto-mocking everything
  resetMocks: true, // Reset mocks after each test to prevent pollution
  clearMocks: true, // Clear mocks before each test run

  // 🔥 Advanced Performance Optimizations
  maxWorkers: '80%', // Dynamically allocate CPU resources
  maxConcurrency: 5, // Avoid CPU starvation while ensuring speed
  slowTestThreshold: 3, // Flag tests that take longer than 3s
  forceExit: true, // Ensures tests exit cleanly after execution

  // Smart watch mode
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],

  // Custom reporters for best developer experience
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
          { title: 'Version', value: '1.0.35' },
        ],
        enableMergeData: true,
        includeFailureMsg: true,
      },
    ],
    [
      'jest-stare',
      {
        resultDir: './reports/jest-stare',
        reportTitle: 'Bleu.js Stare Report',
        coverageLink: '../coverage/lcov-report/index.html',
        clear: true,
      },
    ],
  ],

  verbose: true, // Detailed logs for easier debugging
};
