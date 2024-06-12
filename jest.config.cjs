module.exports = {
  verbose: true,
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{js,jsx}"],
  testMatch: ["**/tests/**/*.test.js", "**/?(*.)+(spec|test).js"],
  moduleFileExtensions: ["js", "json", "jsx", "node"],
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  setupFilesAfterEnv: ["<rootDir>/backend/tests/setup.js"],
  testTimeout: 10000,
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json"
    }
  }
};