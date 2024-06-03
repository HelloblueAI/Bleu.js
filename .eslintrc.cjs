module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Possible Errors
    'no-console': 'warn', // Warn when using console.log
    'no-debugger': 'error', // Disallow the use of debugger

    // Best Practices
    'eqeqeq': 'error', // Require the use of === and !==
    'curly': 'error', // Require following curly brace conventions

    // Variables
    'no-unused-vars': 'warn', // Warn on unused variables
    'no-undef': 'error', // Disallow the use of undeclared variables

    // Stylistic Issues
    'indent': ['error', 2], // Enforce consistent indentation (2 spaces)
    'quotes': ['error', 'single'], // Enforce the consistent use of single quotes
    'semi': ['error', 'always'], // Require semicolons

    // ECMAScript 6
    'arrow-spacing': ['error', { 'before': true, 'after': true }], // Enforce consistent spacing before and after the arrow in arrow functions
    'no-var': 'error', // Require let or const instead of var
    'prefer-const': 'error', // Prefer const over let
  },
};
