import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(\\.{1,2}/.*)\\.mjs$': '$1',
    '^(\\.{1,2}/.*)\\.ts$': '$1',
    '^(\\.{1,2}/.*)\\.tsx$': '$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json'
    }],
    '^.+\\.(js|jsx|mjs)$': ['babel-jest', {
      presets: ['@babel/preset-env']
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@tensorflow/tfjs-node|@babel/runtime|@jest/globals)/)'
  ],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.mjs'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  maxWorkers: 4,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.spec.{ts,tsx,js,jsx}'
  ],
  moduleDirectories: ['node_modules', 'src'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  resolver: '<rootDir>/jest.resolver.cjs'
};

export default config; 