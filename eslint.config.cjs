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
    extends: [
      "plugin:vue/vue3-recommended",
      "plugin:prettier/recommended"
    ],
    rules: {
      "vue/no-unused-vars": "warn"
    }
  }
];
