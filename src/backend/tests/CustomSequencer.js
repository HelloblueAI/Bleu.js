/* eslint-env node */
import fs from 'fs';
import path from 'path';

import { default as BaseSequencer } from '@jest/test-sequencer';

class CustomSequencer extends BaseSequencer {
  constructor() {
    super();
    this.retryCount = 2; // Number of retries for failed tests
  }

  /**
   * Sorts the test files based on priority and fallback to alphabetical sorting
   * @param {Array} tests - Array of test objects
   * @returns {Array} Sorted test array
   */
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

  /**
   * Retries failed tests up to a defined retry count
   * @param {Array} tests - Array of tests
   * @param {Array} failedTests - Array of failed tests
   */
  async retry(tests, failedTests) {
    for (const test of failedTests) {
      let retries = this.retryCount;
      while (retries > 0) {
        const result = await this.runTest(test);
        if (result.success) {
          tests.push(test); // Re-add successful test to the test list
          break;
        }
        retries -= 1;
      }
    }
  }

  /**
   * Runs a single test and returns the result
   * @param {Object} test - Test object
   * @returns {Object} Test result
   */
  async runTest(test) {
    try {
      const result = await test.run();
      return { success: result.status === 'passed', result };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Executes all tests and retries failed ones
   * @param {Array} tests - Array of tests
   * @returns {Array} Results of all executed tests
   */
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

  /**
   * Main execution entry point
   * @param {Array} tests - Array of tests
   * @returns {Array} Results of all tests
   */
  async run(tests) {
    const sortedTests = this.sort(tests);
    const results = await this.executeTests(sortedTests);
    return results;
  }

  /**
   * Logs test results to a file
   * @param {Array} results - Array of test results
   */
  logResults(results) {
    const logFilePath = path.join(__dirname, 'test-results.log');
    const logData = results.map((result) => ({
      testPath: result.path,
      status: result.status,
      duration: result.duration || 'N/A',
    }));

    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2), 'utf8');
  }

  /**
   * Runs all tests and logs results
   * @param {Array} tests - Array of tests
   * @returns {Array} Results of all tests
   */
  async all(tests) {
    const results = await super.run(tests);
    this.logResults(results);
    return results;
  }
}

export default CustomSequencer;
