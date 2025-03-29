import type { TransformOptions } from '@babel/core';

const config: TransformOptions = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      }
    }],
    '@babel/preset-typescript'
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', {
      regenerator: true
    }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread'
  ],
  ignore: [
    'node_modules',
    'dist',
    'coverage'
  ]
};

export default config; 