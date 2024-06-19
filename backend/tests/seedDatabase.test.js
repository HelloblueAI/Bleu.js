const RulesEngine = require('../services/rulesEngine');

describe('Rules Engine', () => {
  it('should evaluate data and return the correct events', async () => {
    const rulesEngine = new RulesEngine();
    const data = { temperature: 150 };
    const results = await rulesEngine.evaluate(data);

    console.log('Evaluation results:', results);

    expect(results).toHaveLength(2);
    expect(results[0].message).toBe('High temperature detected');
    expect(results[1].message).toBe('Extremely high temperature detected');
  });
});
