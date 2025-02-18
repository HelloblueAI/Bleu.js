const jsonPlugin = require('eslint-plugin-json');
const jsonParser = require('jsonc-eslint-parser');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2024,
    },
  },
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: jsonParser,
    },
    plugins: {
      json: jsonPlugin,
    },
    rules: {},
  }
];
