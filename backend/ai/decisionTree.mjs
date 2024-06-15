class DecisionTree {
  constructor(tree = null) {
    this.tree = tree;
  }

  // Traverse the tree based on the data provided
  traverse(node, data) {
    if (node.isLeaf) {
      return node.result;
    }
    return this.traverse(node[node.condition(data) ? 'trueBranch' : 'falseBranch'], data);
  }

  // Evaluate the data using the decision tree
  evaluate(data) {
    return this.traverse(this.tree, data);
  }

  // Build the tree dynamically
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
      falseBranch: this.buildTree(subsets.falseSubset, features, target, maxDepth - 1, minSize)
    };
  }

  // Find the majority class in the dataset
  majorityClass(data, target) {
    const counts = data.reduce((acc, item) => {
      acc[item[target]] = (acc[item[target]] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  }

  // Get the best feature and split point for the data
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

  // Get unique split points for a feature
  getSplits(data, feature) {
    return [...new Set(data.map((item) => item[feature]))];
  }

  // Split the data based on a feature and split point
  splitData(data, feature, split) {
    return data.reduce(
      (acc, item) => {
        acc[item[feature] === split ? 'trueSubset' : 'falseSubset'].push(item);
        return acc;
      },
      { trueSubset: [], falseSubset: [] }
    );
  }

  // Calculate the Gini impurity of the split
  calculateGini(trueSubset, falseSubset, target) {
    const totalSize = trueSubset.length + falseSubset.length;
    const trueGini = this.giniImpurity(trueSubset, target);
    const falseGini = this.giniImpurity(falseSubset, target);
    return (trueSubset.length / totalSize) * trueGini + (falseSubset.length / totalSize) * falseGini;
  }

  // Calculate the Gini impurity for a subset
  giniImpurity(subset, target) {
    const counts = subset.reduce((acc, item) => {
      acc[item[target]] = (acc[item[target]] || 0) + 1;
      return acc;
    }, {});
    return 1 - Object.values(counts).reduce((sum, count) => sum + (count / subset.length) ** 2, 0);
  }

  // Visualize the decision tree
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

  // Calculate feature importance
  calculateFeatureImportance() {
    const importance = {};
    this.traverseFeatureImportance(this.tree, importance);
    return importance;
  }

  // Traverse the tree to calculate feature importance
  traverseFeatureImportance(node, importance) {
    if (!node.isLeaf) {
      const feature = this.getFeatureFromCondition(node.condition);
      importance[feature] = (importance[feature] || 0) + 1;
      this.traverseFeatureImportance(node.trueBranch, importance);
      this.traverseFeatureImportance(node.falseBranch, importance);
    }
  }

  // Extract the feature name from a condition function
  getFeatureFromCondition(condition) {
    const match = condition.toString().match(/data\[(\w+)\]/);
    return match ? match[1] : null;
  }
}

export default DecisionTree;
