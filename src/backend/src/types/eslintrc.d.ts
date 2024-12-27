declare module '@eslint/eslintrc' {
  interface ESLintRcConfig {
    parser?: string; // Path to the parser
    parserOptions?: {
      ecmaVersion?: number | string; // ECMAScript version
      sourceType?: 'script' | 'module'; // Source type: 'script' or 'module'
      ecmaFeatures?: Record<string, boolean>; // Additional ECMAScript features
      [key: string]: any; // Other parser options
    };
    env?: Record<string, boolean>; // Environments (e.g., node, browser)
    extends?: string[]; // List of configuration extensions
    plugins?: string[]; // List of plugins
    rules?: Record<string, [string, ...any[]] | string>; // Rules and their configurations
    overrides?: Array<{
      files: string[];
      excludedFiles?: string[];
      rules?: Record<string, [string, ...any[]] | string>;
      [key: string]: any;
    }>; // Overrides for specific file patterns
    settings?: Record<string, any>; // Custom shared settings for rules
    globals?: Record<string, boolean | 'readonly' | 'writable'>; // Global variables
  }

  const eslintrcConfig: ESLintRcConfig;
  export = eslintrcConfig;
}
