import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { defineConfig } from 'rollup';

export default defineConfig({
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: false,
      exports: 'named',
      compact: true,
      minifyInternalExports: true,
      generatedCode: {
        preset: 'es2015',
        arrowFunctions: true,
        constBindings: true,
        objectShorthand: true,
        symbols: false
      }
    },
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: false,
      exports: 'named',
      compact: true,
      minifyInternalExports: true,
      generatedCode: {
        preset: 'es2015',
        arrowFunctions: true,
        constBindings: true,
        objectShorthand: true,
        symbols: false
      }
    }
  ],
  external: [
    'openai',
    'winston',
    'crypto',
    'perf_hooks',
    'cluster',
    'dotenv',
    'wasm-bindgen',
    'wasm-bindgen-futures',
    'js-sys',
    'web-sys',
    '@wasmer/wasmfs',
    '@wasmer/wasi'
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: true,
      browser: false,
      extensions: ['.js', '.ts']
    }),
    commonjs({
      include: 'node_modules/**',
      extensions: ['.js', '.ts'],
      ignoreDynamicRequires: true,
      transformMixedEsModules: true
    }),
    json(),
    typescript({
      tsconfig: 'tsconfig.prod.json',
      clean: true,
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: true,
          declarationDir: 'dist/types',
          sourceMap: false,
          removeComments: true
        }
      }
    }),
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      },
      mangle: {
        properties: {
          regex: /^_/
        }
      },
      output: {
        comments: false
      }
    })
  ]
}); 