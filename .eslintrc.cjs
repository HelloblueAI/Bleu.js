// Import FlatCompat class from @eslint/eslintrc package
const { FlatCompat } = require('@eslint/eslintrc');

// Initialize FlatCompat with recommended configs
const compat = new FlatCompat({
  baseDirectory: __dirname, // Ensure this is set to the directory of your config file
  recommendedConfig: { extends: ["eslint:recommended"] }
});

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
      globals: {
        browser: true,
        es2021: true,
        node: true,
      },
    },
  },
  ...compat.extends('plugin:vue/vue3-recommended'),
  ...compat.extends('plugin:prettier/recommended'),
  {
    rules: {
      // Your custom rules
    },
  },
  {
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
        },
      },
    },
  },
];
