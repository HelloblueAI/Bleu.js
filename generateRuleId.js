import { v4 as uuidv4 } from 'uuid';

const generateRuleId = () => {
  console.log('Generating rule ID');
  return uuidv4();
};

export default generateRuleId;
