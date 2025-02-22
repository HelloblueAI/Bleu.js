module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  forceExit: true,
  detectOpenHandles: true,
  errorOnDeprecated: true,

  transform: {
    '^.+\\.(js|ts|mjs)$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
        plugins: ['@babel/plugin-transform-runtime'],
      },
    ],
  },


  moduleFileExtensions: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/__tests__/$1',
  },

  testMatch: ['<rootDir>/__tests__/**/*.(test|spec).js', '<rootDir>/src/**/*.(test|spec).js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],

  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],


  collectCoverageFrom: [
    'src/**/*.js',
    'src/**/*.mjs',
    'src/**/*.ts',
    '!src/index.mjs',
    '!src/**/*.test.js', 
  ],

  testEnvironmentOptions: { NODE_ENV: 'test' },

  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  globals: { 'ts-jest': { useESM: true } },

  verbose: true,
};
