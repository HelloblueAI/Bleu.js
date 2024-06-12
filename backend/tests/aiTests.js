// Import the AIService from the services directory
const AIService = require('../services/aiService');

describe('AIService', () => {
  let aiService;

  // Initialize a new instance of AIService before each test
  beforeEach(() => {
    aiService = new AIService();
  });

  // Test case for evaluating a single rule
  test('should evaluate a single rule correctly', () => {
    // Add a rule to the AIService
    aiService.addRule({
      condition: (data) => data.type === 'test',
      action: (data) => `Test passed for ${data.name}`,
    });

    // Evaluate the AIService with test data
    const result = aiService.evaluate({ type: 'test', name: 'Unit Test' });

    // Assert that the result contains the expected output
    expect(result).toContain('Test passed for Unit Test');
  });

  // Test case for evaluating multiple rules
  test('should evaluate multiple rules correctly', () => {
    // Add multiple rules to the AIService
    aiService.addRule({
      condition: (data) => data.type === 'test1',
      action: (data) => `Test1 passed for ${data.name}`,
    });

    aiService.addRule({
      condition: (data) => data.type === 'test2',
      action: (data) => `Test2 passed for ${data.name}`,
    });

    // Evaluate the AIService with different sets of test data
    const result1 = aiService.evaluate({ type: 'test1', name: 'Unit Test 1' });
    const result2 = aiService.evaluate({ type: 'test2', name: 'Unit Test 2' });

    // Assert that the results contain the expected outputs
    expect(result1).toContain('Test1 passed for Unit Test 1');
    expect(result2).toContain('Test2 passed for Unit Test 2');
  });

  // Test case for evaluating when no rules match
  test('should return null when no rules match', () => {
    // Add a rule that won't match the test data
    aiService.addRule({
      condition: (data) => data.type === 'non-matching',
      action: (data) => `This should not be triggered`,
    });

    // Evaluate the AIService with test data that doesn't match any rule
    const result = aiService.evaluate({ type: 'test', name: 'Unit Test' });

    // Assert that the result is null
    expect(result).toBeNull();
  });

  // Test case for ensuring action functions execute correctly
  test('should execute action functions correctly', () => {
    // Add a rule with an action function that modifies the data
    aiService.addRule({
      condition: (data) => data.type === 'modify',
      action: (data) => {
        data.modified = true;
        return `Modified ${data.name}`;
      },
    });

    // Evaluate the AIService with test data
    const data = { type: 'modify', name: 'Unit Test' };
    const result = aiService.evaluate(data);

    // Assert that the result contains the expected output and the data was modified
    expect(result).toContain('Modified Unit Test');
    expect(data.modified).toBe(true);
  });
});
