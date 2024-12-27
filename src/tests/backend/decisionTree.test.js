import DecisionTreeService from '../../src/backend/services/decisionTreeService.ts';

describe('DecisionTreeService', () => {
  let trainingData, features, className, testData;

  beforeEach(() => {
    trainingData = [
      { weather: 'sunny', temp: 'hot', play: 'no' },
      { weather: 'sunny', temp: 'cold', play: 'yes' },
      { weather: 'rainy', temp: 'cold', play: 'yes' },
      { weather: 'rainy', temp: 'hot', play: 'no' },
    ];
    features = ['weather', 'temp'];
    className = 'play';
    testData = [
      { weather: 'sunny', temp: 'hot', play: 'no' },
      { weather: 'rainy', temp: 'cold', play: 'yes' },
    ];
  });

  test('builds a decision tree successfully', () => {
    const tree = DecisionTreeService.buildDecisionTree(
      trainingData,
      className,
      features,
    );
    expect(tree).toBeDefined();
    expect(typeof tree).toBe('object');
  });

  test('predicts the correct class based on input data', () => {
    DecisionTreeService.buildDecisionTree(trainingData, className, features);
    const prediction = DecisionTreeService.traverseDecisionTree({
      weather: 'sunny',
      temp: 'cold',
    });
    expect(prediction).toBe('yes');
  });

  test('throws an error when training data is empty', () => {
    expect(() =>
      DecisionTreeService.buildDecisionTree([], className, features),
    ).toThrow('Training data must be a non-empty array of objects.');
  });

  test('throws an error for invalid className', () => {
    expect(() =>
      DecisionTreeService.buildDecisionTree(trainingData, null, features),
    ).toThrow('Class name must be a valid non-empty string.');
  });

  test('throws an error for invalid features array', () => {
    expect(() =>
      DecisionTreeService.buildDecisionTree(trainingData, className, []),
    ).toThrow('Features must be a non-empty array of strings.');
  });

  test('evaluates accuracy of the decision tree', () => {
    DecisionTreeService.buildDecisionTree(trainingData, className, features);
    const accuracy = DecisionTreeService.getAccuracy(testData);
    expect(typeof accuracy).toBe('number');
    expect(accuracy).toBeGreaterThanOrEqual(0);
    expect(accuracy).toBeLessThanOrEqual(1);
  });

  test('throws an error when predicting without building a tree', () => {
    expect(() =>
      DecisionTreeService.traverseDecisionTree({
        weather: 'sunny',
        temp: 'cold',
      }),
    ).toThrow('Decision tree has not been built yet.');
  });

  test('throws an error when evaluating accuracy without building a tree', () => {
    expect(() => DecisionTreeService.getAccuracy(testData)).toThrow(
      'Decision tree has not been built yet.',
    );
  });

  test('handles complex feature sets correctly', () => {
    trainingData = [
      { weather: 'sunny', temp: 'hot', humidity: 'high', play: 'no' },
      { weather: 'sunny', temp: 'cold', humidity: 'low', play: 'yes' },
      { weather: 'rainy', temp: 'cold', humidity: 'low', play: 'yes' },
    ];
    features = ['weather', 'temp', 'humidity'];

    DecisionTreeService.buildDecisionTree(trainingData, className, features);
    const prediction = DecisionTreeService.traverseDecisionTree({
      weather: 'sunny',
      temp: 'cold',
      humidity: 'low',
    });
    expect(prediction).toBe('yes');
  });

  test('throws an error for invalid test data during prediction', () => {
    DecisionTreeService.buildDecisionTree(trainingData, className, features);
    expect(() =>
      DecisionTreeService.traverseDecisionTree({ invalidField: 'value' }),
    ).toThrow('Decision tree traversal failed: invalid feature set.');
  });

  test('resets the decision tree correctly', () => {
    DecisionTreeService.buildDecisionTree(trainingData, className, features);
    DecisionTreeService.resetTree();
    expect(() => DecisionTreeService.traverseDecisionTree({})).toThrow(
      'Decision tree has not been built yet.',
    );
  });
});
