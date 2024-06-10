class DecisionTree {
    constructor(tree) {
      this.tree = tree;
    }
  
    traverse(node, data) {
      if (node.isLeaf) {
        return node.result;
      }
      const condition = node.condition(data);
      if (condition) {
        return this.traverse(node.trueBranch, data);
      } else {
        return this.traverse(node.falseBranch, data);
      }
    }
  
    evaluate(data) {
      return this.traverse(this.tree, data);
    }
  }
  
  module.exports = DecisionTree;
  