const { v4: uuidv4 } = require('uuid');

const generateRuleId = () => {
  console.log('Generating rule ID');
  return uuidv4();
};

module.exports = generateRuleId;
