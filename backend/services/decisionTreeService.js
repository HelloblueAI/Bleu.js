const DecisionTree = require('decision-tree');

class DecisionTreeService {
  constructor() {
    this.tree = null;
  }

  buildDecisionTree(trainingData, className, features) {
    this.tree = new DecisionTree(trainingData, className, features);
    return this.tree;
  }

  traverseDecisionTree(data) {
    if (!this.tree) {
      throw new Error('Decision tree has not been built yet');
    }
    return this.tree.predict(data);
  }

  getAccuracy(testData) {
    if (!this.tree) {
      throw new Error('Decision tree has not been built yet');
    }
    return this.tree.evaluate(testData);
  }
}

module.exports = new DecisionTreeService();
