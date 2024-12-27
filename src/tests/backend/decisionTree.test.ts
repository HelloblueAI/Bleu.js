import DecisionTreeService from '../../src/backend/services/decisionTreeService';

describe('DecisionTreeService', () => {
  let trainingData: Array<Record<string, any>>, features: string[], className: string, testData: Array<Record<string, any>>;

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
    const tree = new DecisionTreeService();
    tree.buildDecisionTree(trainingData, className, features);
    expect(tree).toBeDefined();
    expect(typeof tree).toBe('object');
  });

  test('predicts the correct class based on input data', () => {
    const tree = new DecisionTreeService();
    tree.buildDecisionTree(trainingData, className, features);
    const prediction = tree.traverseDecisionTree({
      weather: 'sunny',
      temp: 'cold',
    });
    expect(prediction).toBe('yes');
  });

  test('throws an error when training data is empty', () => {
    const tree = new DecisionTreeService();
    expect(() =>
      tree.buildDecisionTree([], className, features),
    ).toThrow('Training data must be a non-empty array of objects.');
  });

  test('throws an error for invalid className', () => {
    const tree = new DecisionTreeService();
    expect(() =>
      tree.buildDecisionTree(trainingData, '', features),
    ).toThrow('Class name must be a valid non-empty string.');
  });

  test('throws an error for invalid features array', () => {
    const tree = new DecisionTreeService();
    expect(() =>
      tree.buildDecisionTree(trainingData, className, []),
    ).toThrow('Features must be a non-empty array.');
  });

  test('evaluates accuracy of the decision tree', () => {
    const tree = new DecisionTreeService();
    tree.buildDecisionTree(trainingData, className, features);
    const accuracy = tree.getAccuracy(testData);
    expect(typeof accuracy).toBe('number');
    expect(accuracy).toBeGreaterThanOrEqual(0);
    expect(accuracy).toBeLessThanOrEqual(1);
  });

  test('throws an error when predicting without building a tree', () => {
    const tree = new DecisionTreeService();
    expect(() =>
      tree.traverseDecisionTree({
        weather: 'sunny',
        temp: 'cold',
      }),
    ).toThrow('Decision tree has not been built yet.');
  });

  test('throws an error when evaluating accuracy without building a tree', () => {
    const tree = new DecisionTreeService();
    expect(() => tree.getAccuracy(testData)).toThrow(
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

    const tree = new DecisionTreeService();
    tree.buildDecisionTree(trainingData, className, features);
    const prediction = tree.traverseDecisionTree({
      weather: 'sunny',
      temp: 'cold',
      humidity: 'low',
    });
    expect(prediction).toBe('yes');
  });

  test('throws an error for invalid test data during prediction', () => {
    const tree = new DecisionTreeService();
    tree.buildDecisionTree(trainingData, className, features);
    expect(() =>
      tree.traverseDecisionTree({ invalidField: 'value' }),
    ).toThrow('Decision tree traversal failed: invalid feature set.');
  });

  test('resets the decision tree correctly', () => {
    const tree = new DecisionTreeService();
    tree.buildDecisionTree(trainingData, className, features);
    tree.resetTree();
    expect(() => tree.traverseDecisionTree({})).toThrow(
      'Decision tree has not been built yet.',
    );
  });
});
