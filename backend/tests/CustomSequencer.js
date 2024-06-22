/* eslint-env node */
const fs = require('fs');
const path = require('path');

const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  constructor() {
    super();
    this.retryCount = 2;
  }

  sort(tests) {
    const priorityList = ['critical.test.js', 'important.test.js'];

    const getPriority = (testPath) => {
      const fileName = path.basename(testPath);
      return priorityList.indexOf(fileName);
    };

    return tests.sort((testA, testB) => {
      const priorityA = getPriority(testA.path);
      const priorityB = getPriority(testB.path);

      if (priorityA === -1 && priorityB === -1) {
        return testA.path.localeCompare(testB.path);
      }
      if (priorityA === -1) return 1;
      if (priorityB === -1) return -1;
      return priorityA - priorityB;
    });
  }

  async retry(tests, failedTests) {
    for (const test of failedTests) {
      let retries = this.retryCount;
      while (retries > 0) {
        const result = await this.runTest(test);
        if (result.success) {
          tests.push(test);
          break;
        }
        retries -= 1;
      }
    }
  }

  async runTest(test) {
    try {
      const result = await test.run();
      return { success: result.status === 'passed', result };
    } catch (error) {
      return { success: false, error };
    }
  }

  async executeTests(tests) {
    const results = [];
    const failedTests = [];

    for (const test of tests) {
      const { success, result } = await this.runTest(test);
      results.push(result);
      if (!success) {
        failedTests.push(test);
      }
    }

    await this.retry(tests, failedTests);
    return results;
  }

  async run(tests) {
    // Removed watcher parameter
    const sortedTests = this.sort(tests);
    const results = await this.executeTests(sortedTests);
    return results;
  }

  logResults(results) {
    const logFilePath = path.join(__dirname, 'test-results.log');
    const logData = results.map((result) => ({
      testPath: result.path,
      status: result.status,
      duration: result.duration,
    }));

    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
  }

  async all(tests) {
    const results = await super.run(tests);
    this.logResults(results);
    return results;
  }
}

module.exports = CustomSequencer;
