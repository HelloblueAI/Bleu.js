'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;
var _reduce = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/reduce'),
);
var _keys = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/object/keys'),
);
var _forEach = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/for-each'),
);
var _set = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/set'),
);
var _map = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/map'),
);
var _values = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/object/values'),
);
/* eslint-env node */

class DecisionTree {
  constructor() {
    let tree =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    this.tree = tree;
  }
  traverse(node, data) {
    if (node.isLeaf) {
      return node.result;
    }
    return this.traverse(
      node[node.condition(data) ? 'trueBranch' : 'falseBranch'],
      data,
    );
  }
  evaluate(data) {
    return this.traverse(this.tree, data);
  }
  buildTree(data, features, target) {
    let maxDepth =
      arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 10;
    let minSize =
      arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
    if (data.length <= minSize || maxDepth === 0) {
      return {
        isLeaf: true,
        result: this.majorityClass(data, target),
      };
    }
    const { bestFeature, bestSplit, subsets } = this.getBestSplit(
      data,
      features,
      target,
    );
    if (!bestSplit) {
      return {
        isLeaf: true,
        result: this.majorityClass(data, target),
      };
    }
    return {
      isLeaf: false,
      condition: (data) => data[bestFeature] === bestSplit,
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
  majorityClass(data, target) {
    var _context;
    if (data.length === 0) return null;
    const counts = (0, _reduce.default)(data).call(
      data,
      (acc, item) => {
        acc[item[target]] = (acc[item[target]] || 0) + 1;
        return acc;
      },
      {},
    );
    return (0, _reduce.default)((_context = (0, _keys.default)(counts))).call(
      _context,
      (a, b) => (counts[a] > counts[b] ? a : b),
    );
  }
  getBestSplit(data, features, target) {
    let bestFeature = null;
    let bestSplit = null;
    let bestGini = Infinity;
    let bestSubsets = null;
    (0, _forEach.default)(features).call(features, (feature) => {
      var _context2;
      (0, _forEach.default)((_context2 = this.getSplits(data, feature))).call(
        _context2,
        (split) => {
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
        },
      );
    });
    return {
      bestFeature,
      bestSplit,
      subsets: bestSubsets,
    };
  }
  getSplits(data, feature) {
    return [
      ...new _set.default(
        (0, _map.default)(data).call(data, (item) => item[feature]),
      ),
    ];
  }
  splitData(data, feature, split) {
    return (0, _reduce.default)(data).call(
      data,
      (acc, item) => {
        acc[item[feature] === split ? 'trueSubset' : 'falseSubset'].push(item);
        return acc;
      },
      {
        trueSubset: [],
        falseSubset: [],
      },
    );
  }
  calculateGini(trueSubset, falseSubset, target) {
    const totalSize = trueSubset.length + falseSubset.length;
    const trueGini = this.giniImpurity(trueSubset, target);
    const falseGini = this.giniImpurity(falseSubset, target);
    return (
      (trueSubset.length / totalSize) * trueGini +
      (falseSubset.length / totalSize) * falseGini
    );
  }
  giniImpurity(subset, target) {
    var _context3;
    const counts = (0, _reduce.default)(subset).call(
      subset,
      (acc, item) => {
        acc[item[target]] = (acc[item[target]] || 0) + 1;
        return acc;
      },
      {},
    );
    return (
      1 -
      (0, _reduce.default)((_context3 = (0, _values.default)(counts))).call(
        _context3,
        (sum, count) => sum + (count / subset.length) ** 2,
        0,
      )
    );
  }
  visualize() {
    let node =
      arguments.length > 0 && arguments[0] !== undefined
        ? arguments[0]
        : this.tree;
    let indent =
      arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    if (node.isLeaf) {
      console.log(`${indent}Leaf: ${node.result}`);
    } else {
      this.visualize(node.trueBranch, indent + '  ');
      this.visualize(node.falseBranch, indent + '  ');
    }
  }
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
  getFeatureFromCondition(condition) {
    const match = condition.toString().match(/data\[(\w+)\]/);
    return match ? match[1] : null;
  }
}
var _default = (exports.default = DecisionTree);
