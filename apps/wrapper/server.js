'use strict';

const express = require('express');
const cors = require('cors');

const { IlcAppWrapperSdk } = require('ilc-sdk');
const ReactDOMServer = require('react-dom/server');
const {default: App} = require('./build/server-entry');
const PORT = 8234;

const ilcSdk = new IlcAppWrapperSdk();
const server = express();

if (process.env.NODE_ENV === 'development') {
    const webpack = require('webpack');
    const webpackMiddleware = require('webpack-dev-middleware');

    server.use(
        webpackMiddleware(webpack(require('./webpack.dev')), {
            publicPath: '/',
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            logLevel: 'debug',
        })
    );
} else {
    server.use(cors());
    server.use(express.static('build'));
}

server.get('*', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    const ilcReqData = ilcSdk.processRequest(req);
    let propsOverride = null;
    const renderApp = props => propsOverride = props;

    const serverLocation = new URL(`https://${ilcReqData.getCurrentReqHost()}${ilcReqData.getCurrentReqOriginalUri()}`);
    const html = ReactDOMServer.renderToString(App({ serverLocation, renderApp }));

    ilcSdk.processResponse(ilcReqData, res, {});

    if (propsOverride !== null) {
        return ilcSdk.forwardRequest(ilcReqData, res, { propsOverride });
    }

    res.send(`<div class="app-container">${html}</div>`);
});

server.listen(PORT, () => {
    console.log(`Navbar server started at port ${PORT}`);
});
