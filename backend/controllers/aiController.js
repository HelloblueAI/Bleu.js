const NLPProcessor = require('../ai/nlpProcessor');
const RulesEngine = require('../ai/rulesEngine');
const DecisionTree = require('../ai/decisionTree');

const sampleTree = {
    isLeaf: false,
    condition: (data) => data.someCondition,
    trueBranch: {
        isLeaf: true,
        result: 'True Branch Result'
    },
    falseBranch: {
        isLeaf: true,
        result: 'False Branch Result'
    }
};

const decisionTree = new DecisionTree(sampleTree);
const rulesEngine = new RulesEngine();

exports.processText = (req, res) => {
    const text = req.body.text;
    const processedText = NLPProcessor.processText(text);
    res.json(processedText);
};

exports.evaluateRules = async (req, res) => {
    const facts = req.body;
    const results = await rulesEngine.run(facts);
    res.json(results);
};

exports.predictDecision = (req, res) => {
    const sample = req.body.sample;
    const prediction = decisionTree.evaluate(sample);
    res.json({ prediction });
};
