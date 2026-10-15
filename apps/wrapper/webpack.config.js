/* eslint-env node */
const path = require('path');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');


module.exports = {
    entry: path.resolve(__dirname, 'src/client-entry.js'),
    output: {
        filename: 'client-entry.js',
        libraryTarget: 'system',
        path: path.resolve(__dirname, 'build'),
        chunkLoadingGlobal: 'wpWrapper', // We need this to avoid conflicts of on-demand chunks in the global namespace
        devtoolNamespace: 'AppWrapper',
        clean: true,
    },
    mode: 'production',
    module: {
        // System.register output: leave System.* calls in the source alone (JavaScript modules only).
        parser: { javascript: { system: false } },
        rules: [
            {
                test: /\.js?$/,
                exclude: [path.resolve(__dirname, 'node_modules')],
                loader: 'babel-loader',
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
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
        new MiniCssExtractPlugin({
            filename: `wrapper.css`
        }),
        ...ilcWebpackPluginsFactory().client
    ],
    devtool: 'source-map',
    externals: [],
};
