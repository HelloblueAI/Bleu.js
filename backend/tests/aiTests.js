const AIService = require('../services/aiService');

test('AIService evaluates rules correctly', () => {
  const aiService = new AIService();
  
  aiService.addRule({
    condition: (data) => data.type === 'test',
    action: (data) => `Test passed for ${data.name}`,
  });

  const result = aiService.evaluate({ type: 'test', name: 'Unit Test' });
  expect(result).toContain('Test passed for Unit Test');
});
