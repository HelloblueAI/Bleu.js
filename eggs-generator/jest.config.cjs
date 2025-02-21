module.exports = {
  testEnvironment: 'node',


  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  forceExit: true,
  detectOpenHandles: true,


  transform: {
    '^.+\\.(js|ts)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', {
            targets: { node: 'current' },
            modules: 'auto'
          }]
        ],
        plugins: [
          '@babel/plugin-transform-runtime'
        ]
      }
    ]
  },


  moduleFileExtensions: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/__tests__/$1'
  },


  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).js',
    '<rootDir>/src/**/*.(test|spec).js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],


  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!**/node_modules/**',
    '!**/dist/**'
  ],


  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },


  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,


  globals: {
    'ts-jest': {
      useESM: true
    }
  },

  verbose: true
};
