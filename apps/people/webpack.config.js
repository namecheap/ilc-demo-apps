/* eslint-env node */
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    people: path.resolve(__dirname, 'src/client-entry.js'),
  },
  output: {
    filename: 'people.js',
    libraryTarget: 'system',
    path: path.resolve(__dirname, 'build'),
    chunkLoadingGlobal: 'wpPeopleApp', // We need this to avoid conflicts of on-demand chunks in the global namespace
    devtoolNamespace: 'peopleApp',
  },
  mode: 'production',
  module: {
    rules: [
      { parser: { system: false } },
      {
        test: /\.js?$/,
        exclude: [path.resolve(__dirname, 'node_modules')],
        loader: 'babel-loader',
      },
      {
        test: /node_modules\/.+\.js?$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              defaultExport: true,
            },
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                mode: 'local',
                localIdentName: '[local]___[path][name]_[hash:base64:5]',
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    modules: [__dirname, 'node_modules'],
  },
  plugins: [
    new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: [path.resolve(__dirname, 'build')] }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    ...ilcWebpackPluginsFactory().client,
  ],
  devtool: 'source-map',
  externals: [/^@portal\/*/, /^single-spa$/, /^rxjs\/?.*$/],
  optimization: {
    splitChunks: {
      cacheGroups: {
        // Merge all the CSS into one file
        // MiniCssExtractPlugin doesn't do it automatically
        styles: {
          name: 'people',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
};
