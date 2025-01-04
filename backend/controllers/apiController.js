const AiQuery = require('../models/AiQuery');

// Utility functions
const evaluateCondition = (condition, data) => {
  const { key, operator, value } = condition;
  switch (operator) {
    case 'equals':
      return data[key] === value;
    case 'greater_than':
      return data[key] > value;
    case 'less_than':
      return data[key] < value;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
};

const generateModelCode = (modelName, fields) => {
  const fieldDeclarations = fields
    .map(({ name, type }) => `  ${name}: ${type};`)
    .join('\n');
  return `class ${modelName} {\n${fieldDeclarations}\n}\nmodule.exports = ${modelName};`;
};

const generateControllerCode = (controllerName, actions) => {
  const actionMethods = actions
    .map((action) => `  ${action}() {\n    // ${action} logic\n  }`)
    .join('\n');
  return `class ${controllerName} {\n${actionMethods}\n}\nmodule.exports = ${controllerName};`;
};

const generateUtilityCode = (utilityName, methods) => {
  const utilityMethods = methods
    .map(
      (method) => `
  ${method.name}(${method.params.join(', ')}) {
    ${method.body}
  }`,
    )
    .join('\n');
  return `class ${utilityName} {\n${utilityMethods}\n}\nmodule.exports = ${utilityName};`;
};

const getInstalledDependencies = () => [
  { name: 'express', version: '4.19.2' },
  { name: 'mongoose', version: '7.6.13' },
];

const checkForOutdatedDependencies = (dependencies) =>
  dependencies.map((dep) => ({
    ...dep,
    latest: dep.version === '4.19.2' ? dep.version : '4.19.2',
  }));

const resolveDependencyConflicts = () => [
  { name: 'express', resolvedVersion: '4.19.2' },
];

// Controller functions
const evaluateRule = async (req, res) => {
  const { id } = req.params;
  const { inputData } = req.body;

  if (!inputData) {
    return res.status(400).json({ error: 'Input data is required' });
  }

  try {
    const rule = await AiQuery.findById(id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const passed = rule.conditions.every((condition) =>
      evaluateCondition(condition, inputData),
    );

    const ruleResult = {
      ruleId: id,
      input: inputData,
      passed,
      details: `Rule ${id} evaluated with input data: ${JSON.stringify(inputData)}`,
    };

    return res.status(200).json({
      message: 'Rule evaluated successfully',
      result: ruleResult,
    });
  } catch (error) {
    console.error('Error evaluating rule:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const generateEgg = (req, res) => {
  const { type, options } = req.body;

  try {
    let code;

    switch (type) {
      case 'model':
        code = generateModelCode(options.modelName, options.fields);
        break;
      case 'controller':
        code = generateControllerCode(options.controllerName, options.actions);
        break;
      case 'utility':
        code = generateUtilityCode(options.utilityName, options.methods);
        break;
      default:
        return res.status(400).json({ error: `Unsupported type: ${type}` });
    }

    const egg = {
      id: Date.now(),
      description: `Generated ${type}: ${options.name}`,
      code,
    };

    return res.status(200).json(egg);
  } catch (error) {
    console.error('Error generating egg:', error);
    return res.status(500).json({ error: 'Error generating egg' });
  }
};

const monitorDependencies = (req, res) => {
  try {
    const dependencies = getInstalledDependencies();
    const outdated = checkForOutdatedDependencies(dependencies);

    return res.status(200).json({ dependencies, outdated });
  } catch (error) {
    console.error('Error monitoring dependencies:', error);
    return res.status(500).json({ error: 'Error monitoring dependencies' });
  }
};

const resolveConflicts = (req, res) => {
  try {
    const resolved = resolveDependencyConflicts();
    return res.status(200).json({ resolved });
  } catch (error) {
    console.error('Error resolving conflicts:', error);
    return res.status(500).json({ error: 'Error resolving conflicts' });
  }
};

// Handle invalid routes
const invalidRoute = (req, res) =>
  res.status(404).json({ error: 'Invalid route' });

// Export all controller functions
module.exports = {
  evaluateRule,
  generateEgg,
  monitorDependencies,
  resolveConflicts,
  invalidRoute,
};
