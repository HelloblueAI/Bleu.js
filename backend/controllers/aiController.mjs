import NLPProcessor from '../ai/nlpProcessor.mjs';
import RulesEngine from '../services/rulesEngine.mjs';
import DecisionTree from '../ai/decisionTree.mjs';

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

export const processText = (req, res) => {
    const text = req.body.text;
    const processedText = NLPProcessor.processText(text);
    res.json(processedText);
};

export const evaluateRules = async (req, res) => {
    const facts = req.body;
    const results = await rulesEngine.run(facts);
    res.json(results);
};

export const predictDecision = (req, res) => {
    const sample = req.body.sample;
    const prediction = decisionTree.evaluate(sample);
    res.json({ prediction });
};
