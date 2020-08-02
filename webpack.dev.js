const path = require('path');
const webpackCommon = require('./webpack.common');

module.exports = {
    mode: 'development',
    entry: './src/main.js',
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'main.js'
    },
    module: {
      rules: [  
        {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader'],
        },
        ...webpackCommon.module.rules
      ],
    },
    plugins: [
      ...webpackCommon.plugins,
    ],
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      compress: true,
      port: 9000,
      proxy: {
        '/api': 'http://localhost:8080'
      }
    },
    resolve: {
      extensions: webpackCommon.resolve.extensions
    }
};
