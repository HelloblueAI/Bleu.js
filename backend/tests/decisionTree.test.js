/* eslint-env node, jest */
const DecisionTree = require('../ai/decisionTree.js');

describe('DecisionTree', () => {
  let decisionTree;

  beforeEach(() => {
    decisionTree = new DecisionTree();
  });

  test('should build a tree and evaluate data', () => {
    const data = [
      { feature1: 'A', feature2: 1, label: 'yes' },
      { feature1: 'A', feature2: 2, label: 'no' },
      { feature1: 'B', feature2: 1, label: 'no' },
      { feature1: 'B', feature2: 2, label: 'yes' },
    ];
    const features = ['feature1', 'feature2'];
    const target = 'label';

    const tree = decisionTree.buildTree(data, features, target);
    decisionTree.tree = tree;

    const result1 = decisionTree.evaluate({ feature1: 'A', feature2: 1 });
    const result2 = decisionTree.evaluate({ feature1: 'B', feature2: 2 });

    expect(result1).toBe('yes');
    expect(tree).toBeDefined();
    expect(tree).toHaveProperty('condition');
    expect(tree).toHaveProperty('trueBranch');
    expect(tree).toHaveProperty('falseBranch');
    expect(tree.trueBranch).toHaveProperty('condition');
    expect(tree.trueBranch).toHaveProperty('trueBranch');
    expect(tree.trueBranch).toHaveProperty('falseBranch');
    expect(result2).toBe('yes');
  });

  test('should return majority class when max depth is reached', () => {
    const data = [
      { feature1: 'A', feature2: 1, label: 'yes' },
      { feature1: 'A', feature2: 2, label: 'yes' },
      { feature1: 'B', feature2: 1, label: 'no' },
      { feature1: 'B', feature2: 2, label: 'no' },
    ];
    const features = ['feature1', 'feature2'];
    const target = 'label';

    const tree = decisionTree.buildTree(data, features, target, 1);
    decisionTree.tree = tree;

    const result = decisionTree.evaluate({ feature1: 'A', feature2: 1 });

    expect(result).toBe('yes');
  });

  test('should return null for empty data', () => {
    const data = [];
    const features = ['feature1', 'feature2'];
    const target = 'label';

    const tree = decisionTree.buildTree(data, features, target);
    decisionTree.tree = tree;

    const result = decisionTree.evaluate({ feature1: 'A', feature2: 1 });

    expect(result).toBeNull();
  });

  test('should correctly calculate Gini impurity', () => {
    const data = [
      { feature1: 'A', label: 'yes' },
      { feature1: 'A', label: 'no' },
      { feature1: 'B', label: 'no' },
      { feature1: 'B', label: 'yes' },
    ];
    const trueSubset = data.filter((item) => item.feature1 === 'A');
    const falseSubset = data.filter((item) => item.feature1 === 'B');

    const gini = decisionTree.calculateGini(trueSubset, falseSubset, 'label');

    expect(gini).toBe(0.5);
  });
});
