module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'plugin:prettier/recommended'
  ],
  rules: {
    'no-console': 'warn',
    'no-debugger': 'warn',
    'vue/no-unused-vars': 'warn',
    'prettier/prettier': ['error', { 'endOfLine': 'auto' }],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'eqeqeq': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'space-before-blocks': 'error',
    'keyword-spacing': ['error', { 'before': true, 'after': true }],
    'space-infix-ops': 'error',
    'comma-spacing': ['error', { 'before': false, 'after': true }],
    'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
    'space-unary-ops': ['error', { 'words': true, 'nonwords': false }]
  }
};
