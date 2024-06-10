const ruleEngine = require('../services/ruleEngine');

const evaluateRule = (req, res) => {
  let fact = req.body;

  ruleEngine.execute(fact, (result) => {
    res.json(result);
  });
};

module.exports = {
  evaluateRule
};
