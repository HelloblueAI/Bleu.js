const generateEgg = (options) => {
  const { type, options: eggOptions } = options;
  const code = `class ${eggOptions.modelName} {\n  ${eggOptions.fields.map((field) => `${field.name}: ${field.type};`).join('\n  ')}\n}`;
  return {
    id: 1,
    description: `Model ${eggOptions.modelName} with fields ${eggOptions.fields.map((field) => field.name).join(', ')}`,
    type,
    code,
  };
};

module.exports = generateEgg;
