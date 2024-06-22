module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.vue$': '@vue/vue3-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(get-port)/)', // Transform get-port module
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'vue'],
  testMatch: [
    '**/tests/**/*.test.(js|jsx|ts|tsx)',
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/backend/tests/**/*.test.(js|jsx|ts|tsx)',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx,vue}',
    'backend/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov', 'clover'],
  globals: {
    'vue-jest': { babelConfig: true },
    'ts-jest': { tsconfig: 'tsconfig.json' },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@backend/(.*)$': '<rootDir>/backend/$1',
  },
  projects: [
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/**/*.{js,jsx,ts,tsx,vue}'],
    },
    {
      displayName: 'test',
      testMatch: [
        '<rootDir>/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/**/__tests__/**/*.(js|jsx|ts|tsx)',
        '<rootDir>/backend/tests/**/*.test.{js|jsx|ts|tsx}',
      ],
    },
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  rootDir: '.',
  verbose: true,
  bail: 1,
  testTimeout: 30000,
  maxWorkers: '50%',
};
