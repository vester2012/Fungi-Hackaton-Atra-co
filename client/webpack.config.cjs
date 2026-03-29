const path = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const portfinder = require('portfinder-sync');
const CopyPlugin = require("copy-webpack-plugin");

const port = portfinder.getPort(5173);

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
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: 'babel-loader'
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader']
        }
      ]
    },

    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@libs': path.resolve(__dirname, '../libs')
      }
    },

    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "public/favicon.ico", to: "favicon.ico" }
        ],
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'index.html'),
        inject: 'body'
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'src/assets'),
            to: 'assets',
            noErrorOnMissing: true
          },
          {
            from: path.resolve(__dirname, '../libs/phaser.js'),
            to: 'libs/phaser.js',
            noErrorOnMissing: true
          },
          {
            from: path.resolve(__dirname, '../libs/SpinePluginDebug.js'),
            to: 'libs/SpinePluginDebug.js',
            noErrorOnMissing: true
          }
        ]
      })
    ],

    devServer: {
      port: port,
      static: {
        directory: path.resolve(__dirname, 'dist')
      },
      devMiddleware: {
        writeToDisk: true
      }
    }
  };
};