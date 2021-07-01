/* eslint-env node */
const config = require('./webpack.config.js');
const path = require('path');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;

config.entry = path.resolve(__dirname, 'src/server.js');
config.target = 'node';
config.output.filename = 'server.js';
config.output.libraryTarget = 'commonjs2';
config.plugins = ilcWebpackPluginsFactory({
    publicPathDetection: {
        ssrPublicPath: require('../publicPathTpl')(require('./PORT.json'))
    }
}).server;
config.externals = [];


module.exports = config;


