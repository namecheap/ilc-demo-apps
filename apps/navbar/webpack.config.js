/* eslint-env node */
const path = require('path');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;


module.exports = {
    entry: path.resolve(__dirname, 'src/client.js'),
    output: {
        filename: 'navbar.js',
        libraryTarget: 'system',
        path: path.resolve(__dirname, 'build'),
        chunkLoadingGlobal: 'wpNavbarApp', // We need this to avoid conflicts of on-demand chunks in the global namespace
        devtoolNamespace: '@portal/navbar',
    },
    mode: 'production',
    module: {
        // System.register output: leave System.* calls in the source alone (JavaScript modules only;
        // webpack 5 validates parser options per module type, so a catch-all rule would break JSON imports).
        parser: { javascript: { system: false } },
        rules: [
            {
                test: /\.js?$/,
                exclude: [path.resolve(__dirname, 'node_modules')],
                loader: 'babel-loader',
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                type: 'asset/resource',
            },
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
    externals: [
        /^single-spa$/,
        /^react$/,
        /^react\/lib.*/,
        /^react-dom$/,
        /.*react-dom.*/,
        /^rxjs\/?.*$/,
    ],
};

