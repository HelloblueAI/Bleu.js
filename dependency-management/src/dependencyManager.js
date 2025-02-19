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
const semver = require('semver');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class DependencyError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'DependencyError';
    this.code = code;
  }
}

const readPackageJson = (projectPath = process.cwd()) => {
  try {
    const packagePath = path.join(projectPath, 'package.json');
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch (error) {
    throw new DependencyError(
      'Failed to read package.json',
      'INVALID_PACKAGE_JSON',
    );
  }
};

const getLatestVersions = (dependencies) => {
  return dependencies.map((dep) => {
    try {
      const latest = execSync(`npm view ${dep.name} version`, {
        encoding: 'utf8',
      }).trim();
      return { ...dep, latest };
    } catch (error) {
      return { ...dep, latest: dep.version };
    }
  });
};

const categorizeUpdate = (current, latest) => {
  if (!semver.valid(current) || !semver.valid(latest)) return 'invalid';
  if (semver.major(latest) > semver.major(current)) return 'major';
  if (semver.minor(latest) > semver.minor(current)) return 'minor';
  if (semver.patch(latest) > semver.patch(current)) return 'patch';
  return 'current';
};

const monitorDependencies = async (options = {}) => {
  try {
    const packageJson = readPackageJson(options.projectPath);
    const depsToCheck = {
      ...(packageJson.dependencies || {}),
      ...(options.includeDevDependencies
        ? packageJson.devDependencies || {}
        : {}),
    };

    const dependencies = Object.entries(depsToCheck).map(([name, version]) => ({
      name,
      version: version.replace(/[\^~]/, ''),
      required: version,
    }));

    const dependenciesWithLatest = await getLatestVersions(dependencies);

    const analyzed = dependenciesWithLatest.map((dep) => ({
      ...dep,
      updateType: categorizeUpdate(dep.version, dep.latest),
      updateAvailable: semver.gt(dep.latest, dep.version),
      securityVulnerabilities: [],
    }));

    const outdated = analyzed.filter((dep) => dep.updateAvailable);

    return {
      dependencies: analyzed,
      outdated,
      timestamp: new Date().toISOString(),
      metadata: {
        totalDependencies: analyzed.length,
        outdatedCount: outdated.length,
        majorUpdates: outdated.filter((dep) => dep.updateType === 'major')
          .length,
        minorUpdates: outdated.filter((dep) => dep.updateType === 'minor')
          .length,
        patchUpdates: outdated.filter((dep) => dep.updateType === 'patch')
          .length,
      },
    };
  } catch (error) {
    throw new DependencyError(
      `Failed to monitor dependencies: ${error.message}`,
      'MONITOR_FAILED',
    );
  }
};

const resolveConflicts = async (options = {}) => {
  try {
    const packageJson = readPackageJson(options.projectPath);
    const depsMap = new Map();


    const buildDependencyGraph = (deps, isDev = false) => {
      Object.entries(deps || {}).forEach(([name, version]) => {
        if (!depsMap.has(name)) {
          depsMap.set(name, { versions: new Set(), requestedBy: new Set() });
        }
        depsMap.get(name).versions.add(version);
        depsMap
          .get(name)
          .requestedBy.add(isDev ? 'devDependencies' : 'dependencies');
      });
    };

    buildDependencyGraph(packageJson.dependencies);
    buildDependencyGraph(packageJson.devDependencies, true);

    const conflicts = Array.from(depsMap.entries())
      .filter(([_, data]) => data.versions.size > 1)
      .map(([name, data]) => ({
        name,
        versions: Array.from(data.versions),
        requestedBy: Array.from(data.requestedBy),
      }));

    const resolved = await Promise.all(
      conflicts.map(async (conflict) => {
        const versions = conflict.versions.map((v) => v.replace(/[\^~]/, ''));
        const latest = versions.sort(semver.rcompare)[0];

        return {
          name: conflict.name,
          resolvedVersion: latest,
          previousVersions: versions.filter((v) => v !== latest),
          resolution: 'upgrade',
          requestedBy: conflict.requestedBy,
        };
      }),
    );

    return {
      resolved,
      conflicts,
      unresolved: conflicts.filter(
        (c) => !resolved.find((r) => r.name === c.name),
      ),
      resolutionMetadata: {
        totalConflicts: conflicts.length,
        resolvedCount: resolved.length,
        unresolvedCount: conflicts.length - resolved.length,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    throw new DependencyError(
      `Failed to resolve conflicts: ${error.message}`,
      'RESOLVE_FAILED',
    );
  }
};

module.exports = {
  monitorDependencies,
  resolveConflicts,
  DependencyError,
};
