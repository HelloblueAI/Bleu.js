const { VueLoaderPlugin } = require('vue-loader');
const path = require('path');

module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'jsx', 
          target: 'es2015' 
        }
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin()
  ]
};
