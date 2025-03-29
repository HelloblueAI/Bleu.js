import type { Config } from 'prettier';

/**
 * Prettier Configuration
 * This configuration is designed to enforce consistent code style across the project.
 * It includes specialized settings for different file types and modern coding practices.
 */
const config: Config = {
  // General formatting
  semi: true, // Always add semicolons
  singleQuote: true, // Use single quotes instead of double quotes
  trailingComma: 'all', // Modern trailing comma style for better git diffs
  printWidth: 100, // Slightly wider line length for modern wide screens
  tabWidth: 2, // 2 spaces indentation
  useTabs: false, // Use spaces instead of tabs
  bracketSpacing: true, // Spaces between brackets in object literals
  arrowParens: 'always', // Always include parentheses around arrow function parameters
  endOfLine: 'lf', // Unix-style line endings
  quoteProps: 'as-needed', // Only quote properties when needed
  jsxSingleQuote: false, // Use double quotes in JSX
  jsxBracketSameLine: false, // Put the > of a multi-line JSX element at the next line
  bracketSameLine: false, // Put the > of a multi-line element at the next line
  proseWrap: 'preserve', // Preserve markdown text wrapping
  htmlWhitespaceSensitivity: 'css', // HTML whitespace sensitivity
  vueIndentScriptAndStyle: true, // Indent script and style tags in Vue files
  embeddedLanguageFormatting: 'auto', // Format embedded code

  // File-specific overrides
  overrides: [
    // TypeScript files
    {
      files: ['*.ts', '*.tsx', '*.mts', '*.cts'],
      options: {
        parser: 'typescript',
        semi: true,
        trailingComma: 'all',
      },
    },
    // JavaScript files
    {
      files: ['*.js', '*.jsx', '*.mjs', '*.cjs'],
      options: {
        parser: 'babel',
        semi: true,
      },
    },
    // JSON files
    {
      files: ['*.json', '*.jsonc', '*.json5', 'tsconfig*.json', 'package.json'],
      options: {
        parser: 'json',
        tabWidth: 2,
        trailingComma: 'none', // JSON doesn't support trailing commas
      },
    },
    // Configuration files
    {
      files: ['.prettierrc', '.eslintrc', '.babelrc', '*.config.js', '*.config.ts'],
      options: {
        parser: 'json',
        tabWidth: 2,
      },
    },
    // Markdown files
    {
      files: ['*.md', '*.mdx'],
      options: {
        parser: 'markdown',
        proseWrap: 'preserve',
        printWidth: 80, // Narrower width for better readability in markdown
      },
    },
    // YAML files
    {
      files: ['*.yml', '*.yaml'],
      options: {
        parser: 'yaml',
        tabWidth: 2,
        singleQuote: true,
      },
    },
    // CSS, SCSS, and Less files
    {
      files: ['*.css', '*.scss', '*.less'],
      options: {
        parser: 'css',
        singleQuote: false,
      },
    },
    // HTML files
    {
      files: ['*.html'],
      options: {
        parser: 'html',
        htmlWhitespaceSensitivity: 'css',
      },
    },
    // GraphQL files
    {
      files: ['*.graphql', '*.gql'],
      options: {
        parser: 'graphql',
      },
    },
  ],
};

export default config; 