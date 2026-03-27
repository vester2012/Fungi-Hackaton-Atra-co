const path = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (_, argv) => {
  const isProd = argv.mode === 'production';

  return {
    entry: path.resolve(__dirname, 'src/main.js'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? 'assets/[name].[contenthash].js' : 'assets/[name].js',
      clean: true
    },
    devtool: isProd ? false : 'eval-source-map',
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@libs': path.resolve(__dirname, '../libs')
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'index.html'),
        inject: 'body'
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, '../libs/phaser.js'),
            to: 'libs/phaser.js'
          },
          {
            from: path.resolve(__dirname, '../libs/SpinePluginDebug.js'),
            to: 'libs/SpinePluginDebug.js'
          }
        ]
      })
    ],
    devServer: {
      port: 5173,
      static: {
        directory: path.resolve(__dirname, 'dist')
      }
    }
  };
};
