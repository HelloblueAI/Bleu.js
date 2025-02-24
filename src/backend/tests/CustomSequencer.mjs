import fs from 'fs';
import path from 'path';
import { default as BaseSequencer } from '@jest/test-sequencer';

class CustomSequencer extends BaseSequencer {
  constructor() {
    super();
    this.retryCount = 2; // Number of retries for failed tests
  }

  /**
   * Sorts test files by priority first, then alphabetically.
   * @param {Array} tests - Array of test objects.
   * @returns {Array} Sorted test array.
   */
  sort(tests) {
    const priorityList = ['critical.test.mjs', 'important.test.mjs'];

    const getPriority = (testPath) => {
      const fileName = path.basename(testPath);
      return priorityList.includes(fileName)
        ? priorityList.indexOf(fileName)
        : Infinity;
    };

    return tests.sort((testA, testB) => {
      const priorityA = getPriority(testA.path);
      const priorityB = getPriority(testB.path);

      return priorityA !== priorityB
        ? priorityA - priorityB
        : testA.path.localeCompare(testB.path);
    });
  }

  /**
   * Retries failed tests up to `retryCount` times.
   * @param {Array} failedTests - Array of failed test objects.
   * @returns {Promise<void>}
   */
  async retryFailedTests(failedTests) {
    for (const test of failedTests) {
      let retries = this.retryCount;
      while (retries > 0) {
        const result = await this.runTest(test);
        if (result.success) break;
        retries -= 1;
      }
    }
  }

  /**
   * Runs a test and returns its result.
   * @param {Object} test - Test object.
   * @returns {Promise<{ success: boolean, result: Object }>}
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
   * Executes all tests and retries failed ones.
   * @param {Array} tests - Array of test objects.
   * @returns {Promise<Array>} Array of executed test results.
   */
  async executeTests(tests) {
    const results = [];
    const failedTests = [];

    for (const test of tests) {
      const { success, result } = await this.runTest(test);
      results.push(result);
      if (!success) failedTests.push(test);
    }

    if (failedTests.length) {
      await this.retryFailedTests(failedTests);
    }
    return results;
  }

  /**
   * Runs and sorts tests.
   * @param {Array} tests - Array of test objects.
   * @returns {Promise<Array>} Sorted test results.
   */
  async run(tests) {
    const sortedTests = this.sort(tests);
    return await this.executeTests(sortedTests);
  }

  /**
   * Logs test results to a file.
   * @param {Array} results - Array of test results.
   */
  logResults(results) {
    const logFilePath = new URL('./test-results.log', import.meta.url).pathname;
    const logData = results.map(
      ({ path: testPath, status, duration = 'N/A' }) => ({
        testPath,
        status,
        duration,
      }),
    );

    try {
      fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2), 'utf8');
      console.log(`📌 Test results saved to ${logFilePath}`);
    } catch (error) {
      console.error('❌ Error writing test results:', error);
    }
  }

  /**
   * Runs all tests and logs results.
   * @param {Array} tests - Array of test objects.
   * @returns {Promise<Array>} Results of all tests.
   */
  async all(tests) {
    const results = await super.run(tests);
    this.logResults(results);
    return results;
  }
}

export default CustomSequencer;
