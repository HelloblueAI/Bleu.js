const CustomSequencer = require('../src/utils/CustomSequencer'); 
const { Test } = require('@jest/test-sequencer');

describe('CustomSequencer', () => {
  it('should sequence tests correctly', () => {
    const sequencer = new CustomSequencer();
    const tests = [
      new Test('test1', { order: 1 }),
      new Test('test2', { order: 2 }),
    ];
    const sequencedTests = sequencer.sort(tests);
    expect(sequencedTests).toEqual(tests);
  });
});
