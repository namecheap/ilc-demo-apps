/* eslint-env node */
const path = require('path');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;

module.exports = {
    entry: path.resolve(__dirname, 'src/fetchWithCache.js'),
    output: {
        filename: 'fetchWithCache.js',
        libraryTarget: 'system',
        path: path.resolve(__dirname, 'build'),
        chunkLoadingGlobal: 'wpFetchWithCache', // We need this to avoid conflicts of on-demand chunks in the global namespace
        devtoolNamespace: 'fetchWithCache',
        clean: true,
    },
    mode: 'production',
    module: {
        // System.register output: leave System.* calls in the source alone (JavaScript modules only).
        parser: { javascript: { system: false } },
    },
    resolve: {
        modules: [__dirname, 'node_modules'],
    },
    plugins: [...ilcWebpackPluginsFactory().client],
    devtool: 'source-map',
    externals: [/^rxjs\/?.*$/],
};
