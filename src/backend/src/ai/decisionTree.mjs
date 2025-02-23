'use strict';

class DecisionTree {
  constructor(tree = null) {
    this.tree = tree;
  }

  /**
   * Recursively traverses the decision tree based on input data.
   * @param {Object} node - Current node in the decision tree.
   * @param {Object} data - Input data for evaluation.
   * @returns {string} - Predicted class label.
   */
  traverse(node, data) {
    if (!node) {
      throw new Error('Decision tree is not properly initialized.');
    }
    if (node.isLeaf) {
      return node.result;
    }
    return this.traverse(
      node[node.condition(data) ? 'trueBranch' : 'falseBranch'],
      data
    );
  }

  /**
   * Evaluates input data against the decision tree.
   * @param {Object} data - Input data object.
   * @returns {string} - Prediction result.
   */
  evaluate(data) {
    if (!this.tree) {
      throw new Error('Decision tree has not been built.');
    }
    return this.traverse(this.tree, data);
  }

  /**
   * Builds a decision tree based on input training data.
   * @param {Array} data - Training dataset.
   * @param {Array} features - Features used in the model.
   * @param {string} target - Target variable name.
   * @param {number} [maxDepth=10] - Maximum depth of the tree.
   * @param {number} [minSize=1] - Minimum number of samples per node.
   * @returns {Object} - The trained decision tree.
   */
  buildTree(data, features, target, maxDepth = 10, minSize = 1) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid training data.');
    }
    if (!Array.isArray(features) || features.length === 0) {
      throw new Error('Features list must be a non-empty array.');
    }
    if (typeof target !== 'string') {
      throw new Error('Target must be a valid string.');
    }

    if (data.length <= minSize || maxDepth === 0) {
      return { isLeaf: true, result: this.majorityClass(data, target) };
    }

    const { bestFeature, bestSplit, subsets } = this.getBestSplit(
      data,
      features,
      target
    );

    if (!bestSplit) {
      return { isLeaf: true, result: this.majorityClass(data, target) };
    }

    return {
      isLeaf: false,
      condition: (data) => data[bestFeature] === bestSplit,
      trueBranch: this.buildTree(
        subsets.trueSubset,
        features,
        target,
        maxDepth - 1,
        minSize
      ),
      falseBranch: this.buildTree(
        subsets.falseSubset,
        features,
        target,
        maxDepth - 1,
        minSize
      ),
    };
  }

  /**
   * Determines the majority class label in a dataset.
   * @param {Array} data - Dataset.
   * @param {string} target - Target variable.
   * @returns {string} - Most common class label.
   */
  majorityClass(data, target) {
    if (data.length === 0) return null;
    const counts = data.reduce((acc, item) => {
      acc[item[target]] = (acc[item[target]] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  }

  /**
   * Finds the best feature and split for partitioning the dataset.
   * @param {Array} data - Training data.
   * @param {Array} features - Feature names.
   * @param {string} target - Target variable.
   * @returns {Object} - Best split parameters.
   */
  getBestSplit(data, features, target) {
    let bestFeature = null;
    let bestSplit = null;
    let bestGini = Infinity;
    let bestSubsets = null;

    features.forEach((feature) => {
      this.getSplits(data, feature).forEach((split) => {
        const subsets = this.splitData(data, feature, split);
        const gini = this.calculateGini(subsets.trueSubset, subsets.falseSubset, target);
        if (gini < bestGini) {
          bestGini = gini;
          bestFeature = feature;
          bestSplit = split;
          bestSubsets = subsets;
        }
      });
    });

    return { bestFeature, bestSplit, subsets: bestSubsets };
  }

  /**
   * Retrieves unique values for a feature in the dataset.
   * @param {Array} data - Dataset.
   * @param {string} feature - Feature name.
   * @returns {Array} - Unique values of the feature.
   */
  getSplits(data, feature) {
    return [...new Set(data.map((item) => item[feature]))];
  }

  /**
   * Splits dataset based on a feature and a value.
   * @param {Array} data - Dataset.
   * @param {string} feature - Feature to split on.
   * @param {any} split - Split value.
   * @returns {Object} - Two subsets of data.
   */
  splitData(data, feature, split) {
    return data.reduce(
      (acc, item) => {
        acc[item[feature] === split ? 'trueSubset' : 'falseSubset'].push(item);
        return acc;
      },
      { trueSubset: [], falseSubset: [] }
    );
  }

  /**
   * Calculates the Gini impurity of a split dataset.
   * @param {Array} trueSubset - Subset where condition is true.
   * @param {Array} falseSubset - Subset where condition is false.
   * @param {string} target - Target variable.
   * @returns {number} - Gini impurity score.
   */
  calculateGini(trueSubset, falseSubset, target) {
    const totalSize = trueSubset.length + falseSubset.length;
    const trueGini = this.giniImpurity(trueSubset, target);
    const falseGini = this.giniImpurity(falseSubset, target);
    return (
      (trueSubset.length / totalSize) * trueGini +
      (falseSubset.length / totalSize) * falseGini
    );
  }

  /**
   * Computes Gini impurity for a dataset.
   * @param {Array} subset - Data subset.
   * @param {string} target - Target variable.
   * @returns {number} - Gini impurity score.
   */
  giniImpurity(subset, target) {
    const counts = subset.reduce((acc, item) => {
      acc[item[target]] = (acc[item[target]] || 0) + 1;
      return acc;
    }, {});
    return (
      1 - Object.values(counts).reduce((sum, count) => sum + (count / subset.length) ** 2, 0)
    );
  }

  /**
   * Recursively prints the decision tree.
   * @param {Object} node - Tree node.
   * @param {string} indent - Indentation for visualization.
   */
  visualize(node = this.tree, indent = '') {
    if (node.isLeaf) {
      console.log(`${indent}Leaf: ${node.result}`);
    } else {
      console.log(`${indent}Node: Feature split`);
      this.visualize(node.trueBranch, indent + '  ');
      this.visualize(node.falseBranch, indent + '  ');
    }
  }

  /**
   * Calculates feature importance based on tree splits.
   * @returns {Object} - Importance score for each feature.
   */
  calculateFeatureImportance() {
    const importance = {};
    this.traverseFeatureImportance(this.tree, importance);
    return importance;
  }

  traverseFeatureImportance(node, importance) {
    if (!node.isLeaf) {
      const feature = this.getFeatureFromCondition(node.condition);
      importance[feature] = (importance[feature] || 0) + 1;
      this.traverseFeatureImportance(node.trueBranch, importance);
      this.traverseFeatureImportance(node.falseBranch, importance);
    }
  }
}

export default DecisionTree;
