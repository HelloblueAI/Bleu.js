const DecisionTree = require('../ai/decisionTree');

describe('DecisionTree', () => {
    let decisionTree;

    beforeAll(() => {
        const sampleTree = {
            condition: (data) => data.age > 18,
            trueBranch: {
                condition: (data) => data.income > 50000,
                trueBranch: { isLeaf: true, result: 'Approve' },
                falseBranch: { isLeaf: true, result: 'Reject' }
            },
            falseBranch: { isLeaf: true, result: 'Reject' }
        };
        decisionTree = new DecisionTree(sampleTree);
    });

    it('should evaluate test data correctly', () => {
        const testData1 = { age: 25, income: 60000 };
        const testData2 = { age: 17, income: 40000 };

        expect(decisionTree.evaluate(testData1)).toBe('Approve');
        expect(decisionTree.evaluate(testData2)).toBe('Reject');
    });

    it('should build a tree dynamically and evaluate correctly', () => {
        const data = [
            { age: 25, income: 60000, outcome: 'Approve' },
            { age: 17, income: 40000, outcome: 'Reject' },
            { age: 30, income: 70000, outcome: 'Approve' },
            { age: 20, income: 30000, outcome: 'Reject' }
        ];
        const features = ['age', 'income'];
        const target = 'outcome';

        const builtTree = decisionTree.buildTree(data, features, target);
        decisionTree.tree = builtTree;

        expect(decisionTree.evaluate({ age: 25, income: 60000 })).toBe('Approve');
        expect(decisionTree.evaluate({ age: 19, income: 20000 })).toBe('Reject');
    });
});
