/* eslint-env node */
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WrapperPlugin = require('wrapper-webpack-plugin');


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
        new WrapperPlugin({
            test: /\.js$/, // only wrap output of bundle files with '.js' extension
            header: '(function(define){\n',
            footer: '\n})((window.ILC && window.ILC.define) || window.define);'
        }),

    ],
    devtool: 'source-map',
    externals: [
        /^rxjs\/?.*$/,
    ],
};

