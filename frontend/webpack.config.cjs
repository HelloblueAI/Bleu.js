const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production', // or 'development' based on your needs
  entry: './frontend/src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './frontend/public/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: 'frontend/public/assets', to: 'assets' }],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 4001,
    proxy: {
      '/api': {
        target: 'http://localhost:4002',
        changeOrigin: true,
        pathRewrite: { '^/api': '/api' },
      },
    },
  },
};
