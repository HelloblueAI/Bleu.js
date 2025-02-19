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
'use strict';
/* eslint-env node */

const _reduce = require('@babel/runtime-corejs3/core-js-stable/instance/reduce');
const _keys = require('@babel/runtime-corejs3/core-js-stable/object/keys');
const _forEach = require('@babel/runtime-corejs3/core-js-stable/instance/for-each');
const _set = require('@babel/runtime-corejs3/core-js-stable/set');
const _map = require('@babel/runtime-corejs3/core-js-stable/instance/map');
const _values = require('@babel/runtime-corejs3/core-js-stable/object/values');
const logger = require('../utils/logger'); // Logging added

class DecisionTree {
  constructor(tree = null) {
    this.tree = tree;
  }

  /**
   * Recursively traverses the tree to classify the given data.
   * @param {Object} node - The current tree node.
   * @param {Object} data - The input data.
   * @returns {any} The classification result.
   */
  traverse(node, data) {
    if (!node) throw new Error('Decision tree is not initialized.');
    if (node.isLeaf) return node.result;
    return this.traverse(node[node.condition(data) ? 'trueBranch' : 'falseBranch'], data);
  }

  /**
   * Evaluates the decision tree using input data.
   * @param {Object} data - The input data.
   * @returns {any} The classification result.
   */
  evaluate(data) {
    return this.traverse(this.tree, data);
  }

  /**
   * Builds a decision tree using recursive partitioning.
   * @param {Array} data - Training data.
   * @param {Array} features - List of feature names.
   * @param {String} target - Target variable.
   * @param {Number} [maxDepth=10] - Maximum depth of the tree.
   * @param {Number} [minSize=1] - Minimum samples per leaf node.
   * @returns {Object} The root node of the decision tree.
   */
  buildTree(data, features, target, maxDepth = 10, minSize = 1) {
    if (data.length <= minSize || maxDepth === 0) {
      return { isLeaf: true, result: this.majorityClass(data, target) };
    }

    const { bestFeature, bestSplit, subsets } = this.getBestSplit(data, features, target);
    if (!bestSplit) {
      return { isLeaf: true, result: this.majorityClass(data, target) };
    }

    return {
      isLeaf: false,
      condition: (data) => data[bestFeature] === bestSplit,
      trueBranch: this.buildTree(subsets.trueSubset, features, target, maxDepth - 1, minSize),
      falseBranch: this.buildTree(subsets.falseSubset, features, target, maxDepth - 1, minSize),
    };
  }

  /**
   * Determines the majority class in a dataset.
   * @param {Array} data - Training data.
   * @param {String} target - Target variable.
   * @returns {any} Majority class label.
   */
  majorityClass(data, target) {
    if (!data.length) return null;
    const counts = data.reduce((acc, item) => {
      acc[item[target]] = (acc[item[target]] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  }

  /**
   * Finds the best feature split based on Gini impurity.
   * @param {Array} data - Training data.
   * @param {Array} features - List of feature names.
   * @param {String} target - Target variable.
   * @returns {Object} Best split details.
   */
  getBestSplit(data, features, target) {
    let bestFeature = null, bestSplit = null, bestGini = Infinity, bestSubsets = null;

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
   * Retrieves unique split points for a given feature.
   * @param {Array} data - Training data.
   * @param {String} feature - Feature name.
   * @returns {Array} Unique values for the feature.
   */
  getSplits(data, feature) {
    return [...new Set(data.map((item) => item[feature]))];
  }

  /**
   * Splits data into two subsets based on a feature value.
   * @param {Array} data - Training data.
   * @param {String} feature - Feature name.
   * @param {any} split - Split value.
   * @returns {Object} Data subsets.
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
   * Computes the Gini impurity for a split.
   * @param {Array} trueSubset - First subset.
   * @param {Array} falseSubset - Second subset.
   * @param {String} target - Target variable.
   * @returns {Number} Gini impurity score.
   */
  calculateGini(trueSubset, falseSubset, target) {
    const totalSize = trueSubset.length + falseSubset.length;
    return (
      (trueSubset.length / totalSize) * this.giniImpurity(trueSubset, target) +
      (falseSubset.length / totalSize) * this.giniImpurity(falseSubset, target)
    );
  }

  /**
   * Calculates Gini impurity for a dataset.
   * @param {Array} subset - Data subset.
   * @param {String} target - Target variable.
   * @returns {Number} Gini impurity score.
   */
  giniImpurity(subset, target) {
    const counts = subset.reduce((acc, item) => {
      acc[item[target]] = (acc[item[target]] || 0) + 1;
      return acc;
    }, {});

    return 1 - Object.values(counts).reduce((sum, count) => sum + (count / subset.length) ** 2, 0);
  }

  /**
   * Visualizes the decision tree.
   * @param {Object} node - The current tree node.
   * @param {String} indent - Indentation for tree visualization.
   */
  visualize(node = this.tree, indent = '') {
    if (node.isLeaf) {
      console.log(`${indent}Leaf: ${node.result}`);
    } else {
      console.log(`${indent}Feature: Condition`);
      this.visualize(node.trueBranch, indent + '  ');
      this.visualize(node.falseBranch, indent + '  ');
    }
  }

  /**
   * Calculates feature importance.
   * @returns {Object} Feature importance scores.
   */
  calculateFeatureImportance() {
    const importance = {};
    this.traverseFeatureImportance(this.tree, importance);
    return importance;
  }

  /**
   * Traverses the tree to accumulate feature importance.
   * @param {Object} node - The current tree node.
   * @param {Object} importance - Object to store feature importance.
   */
  traverseFeatureImportance(node, importance) {
    if (!node.isLeaf) {
      const feature = this.getFeatureFromCondition(node.condition);
      importance[feature] = (importance[feature] || 0) + 1;
      this.traverseFeatureImportance(node.trueBranch, importance);
      this.traverseFeatureImportance(node.falseBranch, importance);
    }
  }
}

module.exports = DecisionTree;
