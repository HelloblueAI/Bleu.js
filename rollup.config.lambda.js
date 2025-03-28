import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json' assert { type: 'json' };

export default {
  input: 'lambda/src/index.ts',
  output: {
    file: 'lambda/dist/function.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'named'
  },
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    'aws-lambda'
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.lambda.json',
      declaration: true,
      declarationDir: './lambda/dist/types',
      exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.spec.ts']
    }),
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    })
  ]
}; 