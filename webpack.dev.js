const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
    mode: 'development',
    entry: './src/main.js',
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'main.js'
    },
    module: {
      rules: [
          ...module.rules
      ],
    },
    plugins: [
      ...plugins,
      new BundleAnalyzerPlugin()
    ]
};
