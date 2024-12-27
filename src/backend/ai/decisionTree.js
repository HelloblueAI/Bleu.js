/* eslint-env node */

/**
 * DecisionTree Class - Implements a Decision Tree for classification tasks.
 */
class DecisionTree {
  constructor(tree = null) {
    this.tree = tree; // Root of the decision tree
  }

  /**
   * Traverses the tree for a given data sample.
   * @param {Object} node - Current node of the tree.
   * @param {Object} data - Data sample being evaluated.
   * @returns {*} - Result of the evaluation.
   */
  traverse(node, data) {
    if (node.isLeaf) {
      return node.result;
    }
    return this.traverse(
      node[node.condition(data) ? 'trueBranch' : 'falseBranch'],
      data,
    );
  }

  /**
   * Evaluates a data sample using the decision tree.
   * @param {Object} data - Data sample to evaluate.
   * @returns {*} - Result of the evaluation.
   */
  evaluate(data) {
    if (!this.tree) throw new Error('Tree is not built yet.');
    return this.traverse(this.tree, data);
  }

  /**
   * Builds the decision tree recursively.
   * @param {Array} data - Dataset.
   * @param {Array} features - Features to consider.
   * @param {String} target - Target variable.
   * @param {Number} maxDepth - Maximum depth of the tree.
   * @param {Number} minSize - Minimum size of data at leaf nodes.
   * @returns {Object} - Root node of the decision tree.
   */
  buildTree(data, features, target, maxDepth = 10, minSize = 1) {
    if (data.length <= minSize || maxDepth === 0) {
      return { isLeaf: true, result: this.majorityClass(data, target) };
    }

    const { bestFeature, bestSplit, subsets } = this.getBestSplit(
      data,
      features,
      target,
    );

    if (!bestSplit) {
      return { isLeaf: true, result: this.majorityClass(data, target) };
    }

    return {
      isLeaf: false,
      condition: (sample) => sample[bestFeature] === bestSplit,
      trueBranch: this.buildTree(
        subsets.trueSubset,
        features,
        target,
        maxDepth - 1,
        minSize,
      ),
      falseBranch: this.buildTree(
        subsets.falseSubset,
        features,
        target,
        maxDepth - 1,
        minSize,
      ),
    };
  }

  /**
   * Calculates the majority class for a dataset.
   * @param {Array} data - Dataset.
   * @param {String} target - Target variable.
   * @returns {*} - Majority class.
   */
  majorityClass(data, target) {
    if (data.length === 0) return null;
    const counts = data.reduce((acc, item) => {
      acc[item[target]] = (acc[item[target]] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b,
    );
  }

  /**
   * Identifies the best feature and split point for the dataset.
   * @param {Array} data - Dataset.
   * @param {Array} features - Features to consider.
   * @param {String} target - Target variable.
   * @returns {Object} - Best split information.
   */
  getBestSplit(data, features, target) {
    let bestFeature = null;
    let bestSplit = null;
    let bestGini = Infinity;
    let bestSubsets = null;

    features.forEach((feature) => {
      this.getSplits(data, feature).forEach((split) => {
        const subsets = this.splitData(data, feature, split);
        const gini = this.calculateGini(
          subsets.trueSubset,
          subsets.falseSubset,
          target,
        );
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
   * Generates all possible splits for a feature.
   * @param {Array} data - Dataset.
   * @param {String} feature - Feature to split on.
   * @returns {Array} - List of unique split points.
   */
  getSplits(data, feature) {
    return [...new Set(data.map((item) => item[feature]))];
  }

  /**
   * Splits the dataset into two subsets based on a feature and split value.
   * @param {Array} data - Dataset.
   * @param {String} feature - Feature to split on.
   * @param {*} split - Split value.
   * @returns {Object} - Subsets of the dataset.
   */
  splitData(data, feature, split) {
    return data.reduce(
      (acc, item) => {
        acc[item[feature] === split ? 'trueSubset' : 'falseSubset'].push(item);
        return acc;
      },
      { trueSubset: [], falseSubset: [] },
    );
  }

  /**
   * Calculates the Gini impurity for a dataset.
   * @param {Array} subset - Subset of the dataset.
   * @param {String} target - Target variable.
   * @returns {Number} - Gini impurity.
   */
  giniImpurity(subset, target) {
    const counts = subset.reduce((acc, item) => {
      acc[item[target]] = (acc[item[target]] || 0) + 1;
      return acc;
    }, {});
    return (
      1 -
      Object.values(counts).reduce(
        (sum, count) => sum + (count / subset.length) ** 2,
        0,
      )
    );
  }

  /**
   * Visualizes the decision tree in a readable format.
   * @param {Object} node - Current node of the tree.
   * @param {String} indent - Indentation for visualization.
   */
  visualize(node = this.tree, indent = '') {
    if (node.isLeaf) {
      console.log(`${indent}Leaf: ${node.result}`);
    } else {
      console.log(`${indent}Condition: ${node.condition.toString()}`);
      console.log(`${indent}True Branch:`);
      this.visualize(node.trueBranch, indent + '  ');
      console.log(`${indent}False Branch:`);
      this.visualize(node.falseBranch, indent + '  ');
    }
  }
}

module.exports = DecisionTree;
