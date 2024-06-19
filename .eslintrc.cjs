const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: { extends: ["eslint:recommended"] }
});

module.exports = [
  {
    files: ['*.js', '*.vue'],
    ignores: ['node_modules/**'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        browser: true,
        node: true,
        es2021: true,
      },
    },
    plugins: {
      vue: require('eslint-plugin-vue'),
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'warn',
      'vue/no-unused-vars': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'eqeqeq': ['error', 'always'],
      'no-trailing-spaces': 'error',
      'space-before-blocks': 'error',
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-infix-ops': 'error',
      'comma-spacing': ['error', { before: false, after: true }],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'space-unary-ops': ['error', { words: true, nonwords: false }],
    },
  },
  ...compat.extends('plugin:vue/vue3-recommended'),
  ...compat.extends('plugin:prettier/recommended'),
];
