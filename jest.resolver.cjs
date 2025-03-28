const fs = require('fs');
const path = require('path');

module.exports = (path, options) => {
  // Handle ESM modules
  if (path.endsWith('.mjs')) {
    const resolvedPath = path.replace(/\.mjs$/, '');
    if (fs.existsSync(resolvedPath + '.mjs')) {
      return resolvedPath + '.mjs';
    }
  }

  // Handle CommonJS modules
  if (path.endsWith('.cjs')) {
    const resolvedPath = path.replace(/\.cjs$/, '');
    if (fs.existsSync(resolvedPath + '.cjs')) {
      return resolvedPath + '.cjs';
    }
  }

  // Handle TypeScript files
  if (path.endsWith('.ts') || path.endsWith('.tsx')) {
    const resolvedPath = path.replace(/\.(ts|tsx)$/, '');
    if (fs.existsSync(resolvedPath + '.ts')) {
      return resolvedPath + '.ts';
    }
    if (fs.existsSync(resolvedPath + '.tsx')) {
      return resolvedPath + '.tsx';
    }
  }

  // Handle JavaScript files
  if (path.endsWith('.js') || path.endsWith('.jsx')) {
    const resolvedPath = path.replace(/\.(js|jsx)$/, '');
    if (fs.existsSync(resolvedPath + '.js')) {
      return resolvedPath + '.js';
    }
    if (fs.existsSync(resolvedPath + '.jsx')) {
      return resolvedPath + '.jsx';
    }
  }

  // Handle package.json
  if (path.endsWith('package.json')) {
    const resolvedPath = path.replace(/package\.json$/, '');
    if (fs.existsSync(resolvedPath + 'package.json')) {
      return resolvedPath + 'package.json';
    }
  }

  // Handle node_modules
  if (path.startsWith('node_modules/')) {
    const resolvedPath = options.defaultResolver(path, options);
    if (resolvedPath) {
      return resolvedPath;
    }
  }

  // Handle relative paths
  if (path.startsWith('./') || path.startsWith('../')) {
    const resolvedPath = options.defaultResolver(path, options);
    if (resolvedPath) {
      return resolvedPath;
    }
  }

  // Handle absolute paths
  if (path.startsWith('/')) {
    const resolvedPath = options.defaultResolver(path, options);
    if (resolvedPath) {
      return resolvedPath;
    }
  }

  // Handle bare imports
  const resolvedPath = options.defaultResolver(path, options);
  if (resolvedPath) {
    return resolvedPath;
  }

  // Fallback to src directory
  const srcPath = path.join('src', path);
  if (fs.existsSync(srcPath)) {
    return srcPath;
  }

  // If no resolution found, throw error
  throw new Error(`Cannot resolve module '${path}'`);
}; 