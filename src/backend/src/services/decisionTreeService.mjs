import DecisionTree from 'decision-tree';

/**
 * Service for building and using a decision tree.
 */
class DecisionTreeService {
  constructor() {
    this.tree = null;
  }

  /**
   * Builds a decision tree using the provided training data.
   * @param {Array} trainingData - Array of training examples.
   * @param {string} className - The target class for classification.
   * @param {Array} features - Array of feature names used for training.
   * @returns {DecisionTree} - The trained decision tree instance.
   */
  buildDecisionTree(trainingData, className, features) {
    if (!Array.isArray(trainingData) || trainingData.length === 0) {
      throw new Error('❌ Invalid training data provided.');
    }
    if (!className || typeof className !== 'string') {
      throw new Error('❌ Invalid class name provided.');
    }
    if (!Array.isArray(features) || features.length === 0) {
      throw new Error('❌ Features must be a non-empty array.');
    }

    this.tree = new DecisionTree(trainingData, className, features);
    return this.tree;
  }

  /**
   * Predicts an outcome based on the trained decision tree.
   * @param {Object} inputData - The input data object to classify.
   * @returns {string} - The predicted class label.
   */
  traverseDecisionTree(inputData) {
    if (!this.tree) {
      throw new Error('❌ Decision tree has not been built yet.');
    }
    if (typeof inputData !== 'object' || inputData === null) {
      throw new Error('❌ Invalid input data. Expected an object.');
    }

    return this.tree.predict(inputData);
  }

  /**
   * Evaluates the decision tree accuracy against test data.
   * @param {Array} testData - The test dataset.
   * @returns {number} - The accuracy percentage.
   */
  getAccuracy(testData) {
    if (!this.tree) {
      throw new Error('❌ Decision tree has not been built yet.');
    }
    if (!Array.isArray(testData) || testData.length === 0) {
      throw new Error('❌ Test data must be a non-empty array.');
    }

    return this.tree.evaluate(testData);
  }
}

export default new DecisionTreeService();
