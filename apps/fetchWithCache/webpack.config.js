/* eslint-env node */
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;


module.exports = {
    entry: path.resolve(__dirname, 'src/fetchWithCache.js'),
    output: {
        filename: 'fetchWithCache.js',
        libraryTarget: 'system',
        path: path.resolve(__dirname, 'build'),
        devtoolNamespace: 'fetchWithCache',
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: [path.resolve(__dirname, 'node_modules')],
                loader: 'babel-loader',
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
        new CleanWebpackPlugin(['build/fetchWithCache']),
        new CopyWebpackPlugin([
            {from: path.resolve(__dirname, 'src/fetchWithCache.js')}
        ]),
        ...ilcWebpackPluginsFactory({
            publicPathDetection: { systemjsModuleName: '@portal/fetchWithCache' }
        }),
    ],
    devtool: 'source-map',
    externals: [
        /^rxjs\/?.*$/,
    ],
};

