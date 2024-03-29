/* eslint-env node */
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: path.resolve(__dirname, 'src/client-entry.js'),
    output: {
        filename: 'people.js',
        libraryTarget: 'system',
        path: path.resolve(__dirname, 'build'),
        jsonpFunction: 'wpPeopleApp', // We need this to avoid conflicts of on-demand chunks in the global namespace
        devtoolNamespace: 'peopleApp',
    },
    mode: 'production',
    module: {
        rules: [
            { parser: { system: false } },
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
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader?modules&importLoaders=1&localIdentName=[local]___[path][name]_[hash:base64:5]'
                }),
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
        new CleanWebpackPlugin(['build/people']),
        new ExtractTextPlugin({
            allChunks: true,
            filename: 'people.css',
        }),
        ...ilcWebpackPluginsFactory().client
    ],
    devtool: 'source-map',
    externals: [
        /^@portal\/*/,
        /^single-spa$/,
        /^rxjs\/?.*$/,
        /^react$/,
        /^react\/lib.*/,
        /^react-dom$/,
        /.*react-dom.*/,
    ],
};
