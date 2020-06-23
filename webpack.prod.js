const path = require('path');
const { module, plugins } = require('./webpack.common');

module.exports = {
    mode: 'production',
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, './prod/dist'),
        filename: 'main.js',
        publicPath: '/css-center-tricks'
    },
    module: {
      rules: [
          ...module.rules
      ],
    },
    plugins: [
      ...plugins
    ]
};
