//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';
import { visualizer } from 'rollup-plugin-visualizer';

const shouldAnalyze = process.env.ANALYZE === 'true';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Bleu',
      fileName: (format) => `bleu.${format === 'es' ? 'js' : 'umd.cjs'}`
    },
    sourcemap: true,
    rollupOptions: {
      external: [
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
      ],
      output: {
        globals: {
          '@tensorflow/tfjs': 'tf',
          '@tensorflow/tfjs-node': 'tfnode',
          '@huggingface/inference': 'HuggingFace',
          'axios': 'axios'
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild'
  },
  plugins: [
    tsconfigPaths(),
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts']
    }),
    shouldAnalyze && visualizer({
      filename: 'bundle-analysis.html',
      open: true
    })
  ].filter(Boolean),
  optimizeDeps: {
    include: ['@tensorflow/tfjs']
  }
});



