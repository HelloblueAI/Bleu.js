const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat();

module.exports = [
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    rules: {
      "no-console": "warn",
      "no-debugger": "warn",
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      "indent": ["error", 2],
      "linebreak-style": ["error", "unix"],
      "eqeqeq": ["error", "always"],
      "no-trailing-spaces": "error",
      "space-before-blocks": "error",
      "keyword-spacing": ["error", { "before": true, "after": true }],
      "space-infix-ops": "error",
      "comma-spacing": ["error", { "before": false, "after": true }],
      "key-spacing": ["error", { "beforeColon": false, "afterColon": true }],
      "space-unary-ops": ["error", { "words": true, "nonwords": false }]
    }
  },
  {
    files: ["**/*.vue"],
    plugins: {
      vue: require("eslint-plugin-vue")
    },
    languageOptions: {
      parser: require("vue-eslint-parser"),
      parserOptions: {
        parser: require("@babel/eslint-parser"),
        ecmaVersion: 2021,
        sourceType: "module"
      }
    },
    rules: {
      "vue/no-unused-vars": "warn",
      "prettier/prettier": ["error", { "endOfLine": "auto" }]
    }
  },
  ...compat.extends('plugin:vue/vue3-recommended'),
  ...compat.extends('plugin:prettier/recommended')
];
