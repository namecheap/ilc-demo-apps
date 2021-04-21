/* eslint-env node */
const path = require('path');


module.exports = {
    entry: path.resolve(__dirname, 'src/client-entry.js'),
    output: {
        filename: 'client-entry.js',
        libraryTarget: 'amd',
        path: path.resolve(__dirname, 'build'),
    },
    mode: 'production',
    module: {
        rules: [
            {parser: {system: false}},
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
    plugins: [],
    devtool: 'source-map',
    externals: [],
};

