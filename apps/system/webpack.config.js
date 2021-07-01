/* eslint-env node */
const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;


module.exports = {
    entry: path.resolve(__dirname, 'index.js'),
    output: {
        filename: 'index.js',
        libraryTarget: 'system',
        path: path.resolve(__dirname, 'build'),
        jsonpFunction: 'wpSystemApp', // We need this to avoid conflicts of on-demand chunks in the global namespace
        devtoolNamespace: 'SystemApp',
    },
    mode: 'production',
    module: {
        rules: [
            {parser: {system: false}},
            {
                test: /\.js?$/,
                exclude: [path.resolve(__dirname, 'node_modules')],
                loader: 'babel-loader',
            }, {
                test: /\.ejs$/,
                loaders: [
                    'raw-loader',
                ],
            },
        ],
    },
    resolve: {
        modules: [
            __dirname,
            'node_modules',
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            {from: path.resolve(__dirname, 'index.js')}
        ]),
        ...ilcWebpackPluginsFactory().client,
    ],
    devtool: 'source-map',
    externals: [],
};

