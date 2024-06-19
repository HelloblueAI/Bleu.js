const CustomSequencer = require('./CustomSequencer');
const { Test } = require('@jest/test-sequencer');

describe('CustomSequencer', () => {
  it('should sequence tests correctly', () => {
    const sequencer = new CustomSequencer();
    const tests = [
      { path: 'test1', context: { order: 1 } },
      { path: 'test2', context: { order: 2 } },
    ];
    const sequencedTests = sequencer.sort(tests);
    expect(sequencedTests).toEqual(tests);
  });
});
