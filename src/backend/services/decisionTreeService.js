import _ from 'lodash';

interface TreeNode {
  type: 'node' | 'leaf';
  feature?: string;
  class?: string;
  children?: { [key: string]: TreeNode };
}

class DecisionTreeService {
  _tree: TreeNode | null;

  constructor() {
    this._tree = null;
  }

  /**
   * Builds a decision tree based on training data.
   * @param {Array<Object>} trainingData - The data used to train the decision tree.
   * @param {string} className - The name of the target class.
   * @param {Array<string>} features - List of feature names.
   */
  buildDecisionTree(trainingData: Array<Record<string, any>>, className: string, features: string[]): void {
    if (!Array.isArray(trainingData) || trainingData.length === 0) {
      throw new Error('Training data must be a non-empty array.');
    }
    if (typeof className !== 'string' || className.trim() === '') {
      throw new Error('Class name must be a valid non-empty string.');
    }
    if (!Array.isArray(features) || features.length === 0) {
      throw new Error('Features must be a non-empty array.');
    }

    this._tree = this._buildTree(trainingData, className, features);
    console.log('Decision tree successfully built.');
  }

  /**
   * Traverses the decision tree for a given data point.
   * @param {Object} data - Data object with features.
   * @returns {string} - Predicted class.
   */
  traverseDecisionTree(data: Record<string, any>): string {
    if (!this._tree) {
      throw new Error('Decision tree has not been built yet.');
    }

    let node: TreeNode | null = this._tree;
    while (node && node.type !== 'leaf') {
      const featureValue: any = node.feature ? data[node.feature] : undefined;
      node = node.children ? node.children[featureValue] ?? null : null;
      if (!node) {
        throw new Error('Decision tree traversal failed: invalid feature set.');
      }
    }

    return node?.class ?? '';
  }

  /**
   * Resets the decision tree to null.
   */
  resetTree(): void {
    this.tree = null;
    console.log('Decision tree has been reset.');
  }

  /**
   * Computes the accuracy of the decision tree on test data.
   * @param {Array<Object>} testData - Array of test data objects.
   * @returns {number} - Accuracy of the decision tree.
   */
  getAccuracy(testData: Array<Record<string, any>>): number {
    if (!this.tree) {
      throw new Error('Decision tree has not been built yet.');
    }

    const correctPredictions = testData.filter(item => {
      const predictedClass = this.traverseDecisionTree(item);
      return predictedClass === item[this._tree!.className!];
    }).length;

    return correctPredictions / testData.length;
  }

  private _buildTree(data: Array<Record<string, any>>, className: string, features: string[]): TreeNode {
    if (data.length === 0) return { type: 'leaf', class: '' };

    const uniqueClasses = _.uniq(data.map(item => item[className]));
    if (uniqueClasses.length === 1) {
      return { type: 'leaf', class: uniqueClasses[0] };
    }

    if (features.length === 0) {
      const majorityClass = this._getMajorityClass(data, className);
      return { type: 'leaf', class: majorityClass };
    }

    const bestFeature = this._getBestFeature(data, className, features);
    const remainingFeatures = features.filter(feature => feature !== bestFeature);

    const tree: TreeNode = { type: 'node', feature: bestFeature, children: {} };
    const uniqueValues = _.uniq(data.map(item => item[bestFeature]));

    uniqueValues.forEach((value) => {
      const subset = data.filter(item => item[bestFeature] === value);
      if (tree.children) {
        tree.children[value] = this._buildTree(subset, className, remainingFeatures);
      }
    });

    return tree;
  }

  private _getBestFeature(data: Array<Record<string, any>>, className: string, features: string[]): string {
    let bestFeature = null;
    let bestGain = -Infinity;

    features.forEach(feature => {
      const gain = this._calculateInformationGain(data, className, feature);
      if (gain > bestGain) {
        bestGain = gain;
        bestFeature = feature;
      }
    });

    if (bestFeature === null) {
      throw new Error('No best feature found.');
    }
    return bestFeature;
  }

  private _calculateInformationGain(data: Array<Record<string, any>>, className: string, feature: string): number {
    const entropyBefore = this._calculateEntropy(data, className);
    const uniqueValues = _.uniq(data.map(item => item[feature]));

    let entropyAfter = 0;
    uniqueValues.forEach(value => {
      const subset = data.filter(item => item[feature] === value);
      const subsetEntropy = this._calculateEntropy(subset, className);
      entropyAfter += (subset.length / data.length) * subsetEntropy;
    });

    return entropyBefore - entropyAfter;
  }

  private _calculateEntropy(data: Array<Record<string, any>>, className: string): number {
    const total = data.length;
    const classCounts = _.countBy(data, item => item[className]);

    return Object.values(classCounts).reduce((entropy, count) => {
      const probability = count / total;
      return entropy - probability * Math.log2(probability);
    }, 0);
  }

  private _getMajorityClass(data: Array<Record<string, any>>, className: string): string {
    const classCounts = _.countBy(data, item => item[className]);
    return Object.keys(classCounts).reduce((a, b) => (classCounts[a] > classCounts[b] ? a : b));
  }
}

export default DecisionTreeService;
