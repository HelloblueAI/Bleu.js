/* eslint-env node */
import fs from 'fs';
import path from 'path';

import { default as Sequencer } from '@jest/test-sequencer';

class CustomSequencer extends Sequencer {
  sort(tests) {
    const priorityList = ['critical.test.ts', 'important.test.ts'];

    // Assign priority based on the filename
    const getPriority = (testPath) => {
      const fileName = path.basename(testPath);
      return priorityList.indexOf(fileName);
    };

    return tests.sort((testA, testB) => {
      const priorityA = getPriority(testA.path);
      const priorityB = getPriority(testB.path);

      if (priorityA === -1 && priorityB === -1) {
        return testA.path.localeCompare(testB.path); // Default alphabetical order
      }
      if (priorityA === -1) return 1; // Non-priority tests come last
      if (priorityB === -1) return -1; // Priority tests come first
      return priorityA - priorityB; // Sort by priority index
    });
  }

  // Hook to log test results
  logResults(results) {
    const logFilePath = path.join(process.cwd(), 'test-results.log');
    const logData = results.map((result) => ({
      testPath: result.path,
      status: result.status,
    }));

    // Write results asynchronously for better performance
    fs.writeFile(logFilePath, JSON.stringify(logData, null, 2), (err) => {
      if (err) {
        console.error('Error writing test results log:', err);
      }
    });
  }

  // Overriding the `all` method to log results
  async all(tests) {
    const sortedTests = this.sort(tests);
    const results = await super.all(sortedTests);

    this.logResults(results);

    return results;
  }
}

export default CustomSequencer;