// jestSequencer.cjs
const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  /**
   * Determine test order based on dependencies and priorities
   */
  sort(tests) {
    const copyTests = Array.from(tests);

    // Helper to get test priority from filename
    const getTestPriority = (testPath) => {
      if (testPath.includes('unit')) return 1;
      if (testPath.includes('integration')) return 2;
      if (testPath.includes('e2e')) return 3;
      return 4;
    };

    // Helper to check if test name matches Bleujs naming convention
    const isBleuTest = (testPath) => {
      const testName = testPath.toLowerCase();
      return (
        testName.includes('bleu') ||
        testName.includes('egg') ||
        testName.includes('hen')
      );
    };

    // Sort tests based on multiple criteria
    return copyTests.sort((testA, testB) => {
      const pathA = testA.path;
      const pathB = testB.path;

      // Priority 1: Bleujs-specific tests come first
      const isBleuA = isBleuTest(pathA);
      const isBleuB = isBleuTest(pathB);
      if (isBleuA !== isBleuB) {
        return isBleuA ? -1 : 1;
      }

      // Priority 2: Test type priority (unit -> integration -> e2e)
      const priorityA = getTestPriority(pathA);
      const priorityB = getTestPriority(pathB);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Priority 3: Alphabetical order for same priority tests
      return pathA.localeCompare(pathB);
    });
  }

  /**
   * Override for fail-fast functionality
   */
  async allFailedTests(tests) {
    const failedTests = tests.filter(test => test.status === 'failed');
    return failedTests.length > 0 ? failedTests : tests;
  }

  /**
   * Get test runtime data
   */
  getCacheKey(testPath) {
    const pkg = require('./package.json');
    return `${pkg.name}-${pkg.version}-${testPath}`;
  }
}

module.exports = CustomSequencer;
