/* eslint-env node */
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;


module.exports = {
    entry: path.resolve(__dirname, 'src/client-entry.js'),
    output: {
        filename: 'people.js',
        libraryTarget: 'system',
        path: path.resolve(__dirname, 'build'),
        jsonpFunction: 'wpPeopleApp', // We need this to avoid conflicts of on-demand chunks in the global namespace
        devtoolNamespace: 'planetsApp',
    },
    mode: 'production',
    module: {
        rules: [
            {parser: {system: false}},
            {
                test: /\.js?$/,
                exclude: [path.resolve(__dirname, 'node_modules')],
                loader: 'babel-loader',
            },
            {
                test: /node_modules\/.+\.js?$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },
            {
                test: /\.css$/,
                exclude: [path.resolve(__dirname, 'node_modules'), /\.krem.css$/],
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            localIdentName: '[path][name]__[local]',
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins() {
                                return [
                                    require('autoprefixer')
                                ];
                            },
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                include: [path.resolve(__dirname, 'node_modules')],
                exclude: [/\.krem.css$/],
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.krem.css$/,
                exclude: [path.resolve(__dirname, 'node_modules')],
                use: [
                    {
                        loader: 'kremling-loader',
                        options: {
                            namespace: 'people',
                            postcss: {
                                plugins: {
                                    'autoprefixer': {}
                                }
                            }
                        },
                    },
                ]
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
        new CopyWebpackPlugin([
            {from: path.resolve(__dirname, 'src/people.js')}
        ]),
        ...ilcWebpackPluginsFactory({
            publicPathDetection: { systemjsModuleName: '@portal/people' }
        })
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

