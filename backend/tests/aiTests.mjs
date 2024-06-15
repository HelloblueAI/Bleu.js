import AIService from '../services/aiService.mjs';

describe('AIService', () => {
  let aiService;

  beforeEach(() => {
    aiService = new AIService();
  });

  test('should evaluate a single rule correctly', async () => {
    await aiService.addRule({
      name: 'Test Rule 1',
      conditions: ['data.type === "test"'],
      actions: ['return `Test passed for ${data.name}`'],
    });

    const result = await aiService.evaluateRules({ type: 'test', name: 'Unit Test' });

    expect(result).toContainEqual({ result: 'Test passed for Unit Test' });
  });

  test('should evaluate multiple rules correctly', async () => {
    await aiService.addRule({
      name: 'Test Rule 1',
      conditions: ['data.type === "test1"'],
      actions: ['return `Test1 passed for ${data.name}`'],
    });

    await aiService.addRule({
      name: 'Test Rule 2',
      conditions: ['data.type === "test2"'],
      actions: ['return `Test2 passed for ${data.name}`'],
    });

    const result1 = await aiService.evaluateRules({ type: 'test1', name: 'Unit Test 1' });
    const result2 = await aiService.evaluateRules({ type: 'test2', name: 'Unit Test 2' });

    expect(result1).toContainEqual({ result: 'Test1 passed for Unit Test 1' });
    expect(result2).toContainEqual({ result: 'Test2 passed for Unit Test 2' });
  });

  test('should return null when no rules match', async () => {
    await aiService.addRule({
      name: 'Non-Matching Rule',
      conditions: ['data.type === "non-matching"'],
      actions: ['return `This should not be triggered`'],
    });

    const result = await aiService.evaluateRules({ type: 'test', name: 'Unit Test' });

    expect(result).toBeNull();
  });

  test('should execute action functions correctly', async () => {
    await aiService.addRule({
      name: 'Modify Rule',
      conditions: ['data.type === "modify"'],
      actions: ['data.modified = true; return `Modified ${data.name}`'],
    });

    const data = { type: 'modify', name: 'Unit Test' };
    const result = await aiService.evaluateRules(data);

    expect(result).toContainEqual({ result: 'Modified Unit Test' });
    expect(data.modified).toBe(true);
  });
});
