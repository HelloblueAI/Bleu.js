import type { Config } from '@jest/types';
import { resolve as resolveTs } from 'ts-jest/dist/config/paths-to-typescript';
import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface TsConfig {
  compilerOptions: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
}

function readTsConfig(): TsConfig {
  const tsConfigPath = resolve(process.cwd(), 'tsconfig.json');
  const tsConfigContent = readFileSync(tsConfigPath, 'utf8');
  return JSON.parse(tsConfigContent);
}

export function createJestConfig(source: string, options: Config.InitialOptions = {}): Config.InitialOptions {
  const tsConfig = readTsConfig();
  const { compilerOptions } = tsConfig;

  const baseConfig: Config.InitialOptions = {
    rootDir: process.cwd(),
    moduleNameMapper: compilerOptions.paths
      ? pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })
      : {},
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
      '^.+\\.tsx?$': ['ts-jest', {
        tsconfig: 'tsconfig.json'
      }]
    },
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.ts'],
    ...options
  };

  return baseConfig;
}

export default function resolver(path: string, options: any): string {
  // First try to resolve as TypeScript
  try {
    return resolveTs(path, options);
  } catch (e) {
    // If TypeScript resolution fails, try standard resolution
    return options.defaultResolver(path, options);
  }
} 