const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat();

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'off', 
    'no-debugger': 'error',
    'eqeqeq': 'error',
    'curly': 'error',
    'no-unused-vars': 'warn',
    'no-undef': 'error',
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'arrow-spacing': ['error', { before: true, after: true }],
    'no-var': 'error',
    'prefer-const': 'error',
  },
};
