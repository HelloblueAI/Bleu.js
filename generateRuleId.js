const { ObjectId } = require('mongodb');

const newRuleId = new ObjectId().toString();

console.log('New Rule ID:', newRuleId);
