/* eslint-env node */
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;

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
                test: /node_modules\/.+\.js?$/,
                enforce: 'pre',
                use: ['source-map-loader'],
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            modules: {
                                localIdentName: '[local]___[path][name]_[hash:base64:5]',
                                // react-css-modules expects the class map as the default export
                                namedExport: false,
                                exportLocalsConvention: 'as-is',
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
        new MiniCssExtractPlugin({
            filename: 'people.css',
        }),
        ...ilcWebpackPluginsFactory().client,
    ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                // ILC loads a single people.css, so keep the CSS of lazy chunks in it as well
                // (extract-text-webpack-plugin's allChunks behaviour).
                styles: {
                    name: 'people',
                    type: 'css/mini-extract',
                    chunks: 'all',
                    enforce: true,
                },
            },
        },
    },
    devtool: 'source-map',
    externals: [/^@portal\/*/, /^single-spa$/, /^rxjs\/?.*$/, /^react$/, /^react\/lib.*/, /^react-dom$/, /.*react-dom.*/],
};
