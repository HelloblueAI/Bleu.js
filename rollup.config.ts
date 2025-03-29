import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';

const isProduction = process.env.NODE_ENV === 'production';
const shouldAnalyze = process.env.ANALYZE === 'true';

const external = [
  '@tensorflow/tfjs',
  '@tensorflow/tfjs-node',
  '@huggingface/inference',
  'axios',
  'cors',
  'express',
  'ioredis',
  'jsonwebtoken',
  'mongoose',
  'node-cache',
  'qiskit',
  'rate-limiter-flexible',
  'redis',
  'winston',
  'zod'
];

const plugins = [
  resolve({
    preferBuiltins: true,
    extensions: ['.ts', '.js', '.json']
  }),
  commonjs(),
  json(),
  typescript({
    tsconfig: './tsconfig.json',
    sourceMap: !isProduction,
    declaration: true,
    declarationDir: './dist/types'
  }),
  shouldAnalyze && visualizer({
    filename: 'bundle-analysis.html',
    open: true
  })
].filter(Boolean);

export default defineConfig([
  // Main bundle
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.mjs',
        format: 'es',
        sourcemap: !isProduction
      },
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: !isProduction
      },
      {
        file: 'dist/index.js',
        format: 'umd',
        name: 'Bleu',
        sourcemap: !isProduction,
        globals: {
          '@tensorflow/tfjs': 'tf',
          '@tensorflow/tfjs-node': 'tfnode',
          '@huggingface/inference': 'HuggingFace',
          'axios': 'axios'
        }
      }
    ],
    external,
    plugins
  },
  // Types bundle
  {
    input: 'dist/types/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  }
]); 