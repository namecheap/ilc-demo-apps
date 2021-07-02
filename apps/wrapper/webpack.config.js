/* eslint-env node */
const path = require('path');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;


module.exports = {
    entry: path.resolve(__dirname, 'src/client-entry.js'),
    output: {
        filename: 'client-entry.js',
        libraryTarget: 'system',
        path: path.resolve(__dirname, 'build'),
        jsonpFunction: 'wpWrapper', // We need this to avoid conflicts of on-demand chunks in the global namespace
        devtoolNamespace: 'AppWrapper',
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
    plugins: ilcWebpackPluginsFactory().client,
    devtool: 'source-map',
    externals: [],
};

