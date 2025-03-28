//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
const { monitorDependencies, resolveConflicts, DependencyError } = require('./src/dependencyManager');
const fs = require('fs');
const { execSync } = require('child_process');

// Mock fs and child_process modules
jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

const mockPackageJson = {
  dependencies: {
    "mongoose": "5.13.7",
    "express": "4.17.1",
    "lodash": "4.17.21"
  },
  devDependencies: {
    "jest": "27.0.6",
    "eslint": "7.32.0"
  }
};

describe('Dependency Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fs.readFileSync.mockImplementation(() => JSON.stringify(mockPackageJson));

    execSync.mockImplementation((command) => {
      const packageName = command.split(' ')[2];
      const mockVersions = {
        mongoose: '6.0.0',
        express: '4.18.0',
        lodash: '4.17.22',
        jest: '27.0.6',
        eslint: '8.0.0'       
      };
      return mockVersions[packageName] || '1.0.0';
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('monitorDependencies', () => {
    it('should successfully monitor dependencies with default options', async () => {
      const result = await monitorDependencies();

      expect(result).toEqual(expect.objectContaining({
        dependencies: expect.any(Array),
        outdated: expect.any(Array),
        timestamp: expect.any(String),
        metadata: expect.any(Object)
      }));
    });

    it('should correctly identify different update types', async () => {
      const result = await monitorDependencies();

      const mongoose = result.dependencies.find(d => d.name === 'mongoose');
      const express = result.dependencies.find(d => d.name === 'express');
      const lodash = result.dependencies.find(d => d.name === 'lodash');

      expect(mongoose.updateType).toBe('major');
      expect(express.updateType).toBe('minor');
      expect(lodash.updateType).toBe('patch');
    });

    it('should include devDependencies when specified', async () => {
      const result = await monitorDependencies({ includeDevDependencies: true });

      const depNames = result.dependencies.map(d => d.name);
      expect(depNames).toContain('jest');
      expect(depNames).toContain('eslint');
    });

    it('should exclude devDependencies by default', async () => {
      const result = await monitorDependencies();

      const depNames = result.dependencies.map(d => d.name);
      expect(depNames).not.toContain('jest');
      expect(depNames).not.toContain('eslint');
    });

    it('should handle npm registry errors gracefully', async () => {
      execSync.mockImplementationOnce(() => {
        throw new Error('npm registry error');
      });

      const result = await monitorDependencies();
      expect(result.dependencies[0].latest).toBe(result.dependencies[0].version);
    });

    it('should generate accurate metadata', async () => {
      const result = await monitorDependencies({ includeDevDependencies: true });

      expect(result.metadata).toEqual({
        totalDependencies: expect.any(Number),
        outdatedCount: expect.any(Number),
        majorUpdates: expect.any(Number),
        minorUpdates: expect.any(Number),
        patchUpdates: expect.any(Number)
      });

      expect(result.metadata.totalDependencies).toBe(
        Object.keys(mockPackageJson.dependencies).length +
        Object.keys(mockPackageJson.devDependencies).length
      );
    });
  });

  describe('resolveConflicts', () => {
    it('should successfully resolve dependency conflicts', async () => {
      const result = await resolveConflicts();

      expect(result).toEqual(expect.objectContaining({
        resolved: expect.any(Array),
        conflicts: expect.any(Array),
        unresolved: expect.any(Array),
        resolutionMetadata: expect.any(Object)
      }));
    });

    it('should handle empty dependency lists', async () => {
      fs.readFileSync.mockImplementationOnce(() => JSON.stringify({
        dependencies: {},
        devDependencies: {}
      }));

      const result = await resolveConflicts();
      expect(result.conflicts).toHaveLength(0);
      expect(result.resolved).toHaveLength(0);
    });

    it('should correctly identify conflicts across dependencies and devDependencies', async () => {
      fs.readFileSync.mockImplementationOnce(() => JSON.stringify({
        dependencies: {
          "lodash": "4.17.21"
        },
        devDependencies: {
          "lodash": "4.17.20"
        }
      }));

      const result = await resolveConflicts();
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].name).toBe('lodash');
      expect(result.conflicts[0].versions).toHaveLength(2);
    });

    it('should generate accurate resolution metadata', async () => {
      const result = await resolveConflicts();

      expect(result.resolutionMetadata).toEqual({
        totalConflicts: expect.any(Number),
        resolvedCount: expect.any(Number),
        unresolvedCount: expect.any(Number),
        timestamp: expect.any(String)
      });
    });
  });
});
