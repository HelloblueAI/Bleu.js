// eslint.config.cjs
const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat();

module.exports = {
  files: ['**/*.js', '**/*.ts', '**/*.tsx'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'prettier/prettier': 'error',
  },
};
