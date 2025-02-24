import { writeFileSync } from 'fs';

class CustomSequencer {
  /**
   * Sorts tests based on priority: critical > high > normal
   * @param {Array} tests - List of test files
   * @returns {Array} Sorted tests
   */
  sort(tests) {
    const priorities = { critical: 1, high: 2, normal: 3 };

    return tests.sort((a, b) => {
      const priorityA = priorities[a.priority] || 3;
      const priorityB = priorities[b.priority] || 3;
      return priorityA - priorityB;
    });
  }

  /**
   * Retries failed tests up to retry limit
   * @param {Array} tests - Failed test cases
   */
  async retry(tests) {
    const retryLimit = 2;
    for (let i = 0; i < retryLimit; i++) {
      for (const test of tests) {
        try {
          await test.run();
        } catch (error) {
          console.error(`⚠️ Retry failed for ${test.name}:`, error);
        }
      }
    }
  }

  /**
   * Runs all tests in sorted order
   * @param {Array} tests - List of test files
   * @returns {Array} Test results
   */
  async run(tests) {
    console.log('🚀 Running tests in priority order...');
    const sortedTests = this.sort(tests);
    const results = [];

    for (const test of sortedTests) {
      try {
        const result = await test.run();
        results.push(result);
      } catch (error) {
        console.error(`❌ Test failed: ${test.name}`, error);
      }
    }

    console.log('✅ Test execution completed.');
    return results;
  }

  /**
   * Logs test results to a file
   * @param {Array} results - Test results
   */
  logResults(results) {
    try {
      writeFileSync(
        'test-results.log',
        JSON.stringify(results, null, 2),
        'utf8',
      );
      console.log('📄 Test results saved to test-results.log');
    } catch (error) {
      console.error('❌ Error saving test results:', error);
    }
  }
}

// ✅ Use ES module export syntax
export default CustomSequencer;
