const decisionTreeService = require('../src/services/decisionTreeService');

describe('Decision Tree Service', () => {
  let mockTreeData;

  beforeEach(() => {
    mockTreeData = {
      features: ['age', 'income', 'credit_score'],
      labels: ['approved', 'denied'],
      trainingData: [
        { age: 25, income: 50000, credit_score: 700 },
        { age: 35, income: 75000, credit_score: 750 },
        { age: 45, income: 100000, credit_score: 800 }
      ]
    };
  });

  test('should initialize decision tree with valid data', () => {
    const tree = decisionTreeService.initializeTree(mockTreeData);
    expect(tree).toBeDefined();
    expect(tree.features).toEqual(expect.arrayContaining(mockTreeData.features));
  });

  test('should train model with training data', async () => {
    const trainedModel = await decisionTreeService.trainModel(mockTreeData.trainingData);
    expect(trainedModel.isTrained).toBe(true);
    expect(trainedModel.accuracy).toBeGreaterThan(0);
  });

  test('should make predictions with trained model', async () => {
    const model = await decisionTreeService.trainModel(mockTreeData.trainingData);
    const testCase = { age: 30, income: 60000, credit_score: 725 };
    const prediction = await decisionTreeService.predict(model, testCase);
    expect(prediction).toBeDefined();
    expect(['approved', 'denied']).toContain(prediction.result);
  });

  test('should handle missing features gracefully', async () => {
    const model = await decisionTreeService.trainModel(mockTreeData.trainingData);
    const invalidTestCase = { age: 30 };
    await expect(decisionTreeService.predict(model, invalidTestCase))
      .rejects.toThrow('Missing required features');
  });

  test('should validate input data format', () => {
    const invalidData = {
      features: ['age'],
      labels: [],
      trainingData: []
    };
    expect(() => decisionTreeService.validateData(invalidData))
      .toThrow('Invalid data format');
  });
});
