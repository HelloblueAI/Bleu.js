//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
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
