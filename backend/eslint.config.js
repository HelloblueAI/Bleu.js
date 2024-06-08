import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import recommended from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        browser: true,
        node: true,
        jest: true,
        require: 'readonly',
        module: 'readonly',
        console: 'readonly',
        process: 'readonly',
        describe: 'readonly',
        beforeAll: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        setTimeout: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'off',
      'no-debugger': 'error',
      eqeqeq: 'error',
      curly: 'error',
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'arrow-spacing': ['error', { before: true, after: true }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  js.configs.recommended,
  recommended,
];
