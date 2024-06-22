// Define the generateEgg function
function generateEgg(options) {
  const { description, type, options: eggOptions } = options;
  const egg = {
    description,
    type,
    options: eggOptions,
  };
  return egg;
}

module.exports = { generateEgg };
