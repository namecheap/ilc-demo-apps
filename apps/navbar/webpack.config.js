/* eslint-env node */
const path = require('path');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;


module.exports = {
    entry: path.resolve(__dirname, 'src/navbar.js'),
    output: {
        filename: 'navbar.js',
        libraryTarget: 'amd',
        path: path.resolve(__dirname, 'build'),
    },
    mode: 'production',
    module: {
        rules: [
            {parser: {System: false}},
            {
                test: /\.js?$/,
                exclude: [path.resolve(__dirname, 'node_modules')],
                loader: 'babel-loader',
            }
        ],
    },
    resolve: {
        modules: [
            __dirname,
            'node_modules',
        ],
    },
    plugins: ilcWebpackPluginsFactory(),
    devtool: 'source-map',
    externals: [
        /^single-spa$/,
        /^react$/,
        /^react\/lib.*/,
        /^react-dom$/,
        /.*react-dom.*/,
        /^rxjs\/?.*$/,
    ],
};

