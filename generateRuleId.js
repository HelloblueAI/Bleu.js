import { v4 as uuidv4 } from 'uuid';

const generateRuleId = (() => {
  const cache = new Set();

  return () => {
    let ruleId;
    do {
      ruleId = uuidv4();
    } while (cache.has(ruleId));

    cache.add(ruleId);

    if (cache.size > 1000) cache.clear(); 

    console.debug(`[RuleID Generator] New ID Generated: ${ruleId}`);
    return ruleId;
  };
})();

export default generateRuleId;
