import Sequencer from '@jest/test-sequencer';

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Prioritize specific tests if needed
    const prioritizedTests = tests.filter(test => 
      test.path.includes('priority.test.js')
    );

    const otherTests = tests.filter(test => 
      !test.path.includes('priority.test.js')
    );

    // Sort by file size (example sorting logic)
    prioritizedTests.sort((a, b) => a.path.length - b.path.length);
    otherTests.sort((a, b) => a.path.length - b.path.length);

    // Concatenate prioritized tests followed by other tests
    return [...prioritizedTests, ...otherTests];
  }
}

export default CustomSequencer;
