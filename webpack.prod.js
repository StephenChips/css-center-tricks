const path = require('path');
const webpackCommon = require('./webpack.common');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
module.exports = {
    mode: 'production',
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'public/main.[hash].js',
        publicPath: '/css-center-tricks'
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [ MiniCssExtractPlugin.loader, 'css-loader' ]
        },
          ...webpackCommon.module.rules
      ],
    },
    plugins: [
      ...webpackCommon.plugins,
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: 'public/[name].[hash].css',
        chunkFilename: '[id].css',
      }),
      //new BundleAnalyzerPlugin()
    ],
    resolve: {
      extensions: webpackCommon.resolve.extensions
    }
};
