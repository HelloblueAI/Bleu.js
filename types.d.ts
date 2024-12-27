// Global TypeScript Declarations

// Removed 'eslint-plugin-import' module declaration as it resolves to an untyped module.

// Extend the global namespace for additional global variables.
// types.d.ts

// Extend the Node.js global object to include Jest-specific properties if necessary.
declare namespace NodeJS {
  interface Global {
    mongoClient?: import('mongodb').MongoClient;
  }
}

// Add declaration for any untyped or custom modules, if required.
declare module '*.json' {
  const value: any;
  export default value;
}

// Fix for Jest mocking errors, if `jest-mock` is being used directly.
import * as jest from 'jest';

declare module 'jest-mock' {}

export {}; // Ensure the file is treated as a module.
