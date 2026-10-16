/* eslint-env node */
const config = require('./webpack.config.js');

config.devServer = {
    headers: {
        'Access-Control-Allow-Origin': '*',
    },
    allowedHosts: 'all',
};

config.mode = 'development';

module.exports = config;
