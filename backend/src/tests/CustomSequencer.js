'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;
var _indexOf = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/index-of'),
);
var _sort = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/sort'),
);
var _map = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/map'),
);
var _stringify = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/json/stringify'),
);
var _fs = _interopRequireDefault(require('fs'));
var _path = _interopRequireDefault(require('path'));
var _testSequencer = _interopRequireDefault(require('@jest/test-sequencer'));
/* eslint-env node */

class CustomSequencer extends _testSequencer.default {
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
      const fileName = _path.default.basename(testPath);
      return (0, _indexOf.default)(priorityList).call(priorityList, fileName);
    };
    return (0, _sort.default)(tests).call(tests, (testA, testB) => {
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
      return {
        success: result.status === 'passed',
        result,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
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
    var _context;
    const sortedTests = (0, _sort.default)((_context = this)).call(
      _context,
      tests,
    );
    const results = await this.executeTests(sortedTests);
    return results;
  }

  /**
   * Logs test results to a file
   * @param {Array} results - Array of test results
   */
  logResults(results) {
    const logFilePath = _path.default.join(__dirname, 'test-results.log');
    const logData = (0, _map.default)(results).call(results, (result) => ({
      testPath: result.path,
      status: result.status,
      duration: result.duration || 'N/A',
    }));
    _fs.default.writeFileSync(
      logFilePath,
      (0, _stringify.default)(logData, null, 2),
      'utf8',
    );
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
var _default = (exports.default = CustomSequencer);
