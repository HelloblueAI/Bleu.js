import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default defineConfig({
  input: 'src/lambda/index.ts',
  output: {
    dir: 'dist-lambda',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.lambda.json',
      sourceMap: true
    }),
    resolve({
      preferBuiltins: true
    }),
    commonjs(),
    json(),
    terser()
  ],
  external: [
    'aws-sdk',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-lambda',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
    'mongoose',
    '@tensorflow/tfjs-node'
  ]
}); 