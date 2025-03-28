import fs from 'fs';
import path from 'path';
import type { Resolver } from 'jest-resolve';

const resolver: Resolver = (pathToResolve: string, options: any): string => {
  // Handle ESM modules
  if (pathToResolve.endsWith('.mjs')) {
    const resolvedPath = pathToResolve.replace(/\.mjs$/, '');
    if (fs.existsSync(resolvedPath + '.mjs')) {
      return resolvedPath + '.mjs';
    }
  }

  // Handle CommonJS modules
  if (pathToResolve.endsWith('.cjs')) {
    const resolvedPath = pathToResolve.replace(/\.cjs$/, '');
    if (fs.existsSync(resolvedPath + '.cjs')) {
      return resolvedPath + '.cjs';
    }
  }

  // Handle TypeScript files
  if (pathToResolve.endsWith('.ts') || pathToResolve.endsWith('.tsx')) {
    const resolvedPath = pathToResolve.replace(/\.(ts|tsx)$/, '');
    if (fs.existsSync(resolvedPath + '.ts')) {
      return resolvedPath + '.ts';
    }
    if (fs.existsSync(resolvedPath + '.tsx')) {
      return resolvedPath + '.tsx';
    }
  }

  // Handle JavaScript files
  if (pathToResolve.endsWith('.js') || pathToResolve.endsWith('.jsx')) {
    const resolvedPath = pathToResolve.replace(/\.(js|jsx)$/, '');
    if (fs.existsSync(resolvedPath + '.js')) {
      return resolvedPath + '.js';
    }
    if (fs.existsSync(resolvedPath + '.jsx')) {
      return resolvedPath + '.jsx';
    }
  }

  // Handle package.json
  if (pathToResolve.endsWith('package.json')) {
    const resolvedPath = pathToResolve.replace(/package\.json$/, '');
    if (fs.existsSync(resolvedPath + 'package.json')) {
      return resolvedPath + 'package.json';
    }
  }

  // Handle node_modules
  if (pathToResolve.startsWith('node_modules/')) {
    const resolvedPath = options.defaultResolver(pathToResolve, options);
    if (resolvedPath) {
      return resolvedPath;
    }
  }

  // Handle relative paths
  if (pathToResolve.startsWith('./') || pathToResolve.startsWith('../')) {
    const resolvedPath = options.defaultResolver(pathToResolve, options);
    if (resolvedPath) {
      return resolvedPath;
    }
  }

  // Handle absolute paths
  if (pathToResolve.startsWith('/')) {
    const resolvedPath = options.defaultResolver(pathToResolve, options);
    if (resolvedPath) {
      return resolvedPath;
    }
  }

  // Handle bare imports
  const resolvedPath = options.defaultResolver(pathToResolve, options);
  if (resolvedPath) {
    return resolvedPath;
  }

  // Fallback to src directory
  const srcPath = path.join('src', pathToResolve);
  if (fs.existsSync(srcPath)) {
    return srcPath;
  }

  // If no resolution found, throw error
  throw new Error(`Cannot resolve module '${pathToResolve}'`);
};

export default resolver; 