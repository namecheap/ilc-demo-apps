/* eslint-env node */
const nodeExternals = require('webpack-node-externals');
const config = require('./webpack.config.js');
const path = require('path');

config.entry = path.resolve(__dirname, 'src/server-entry.js');
config.target = 'node';
config.output.filename = 'server-entry.js';
config.output.libraryTarget = 'commonjs2';
config.plugins = [];
config.externals = [nodeExternals()];


module.exports = config;


