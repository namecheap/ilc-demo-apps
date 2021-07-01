'use strict';

const express = require('express');
const cors = require('cors');

const IlcSdk = require('ilc-sdk').default;
const IlcAppSdk = require('ilc-sdk/app').default;
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const {default: App} = require('./build/server');
const PORT = require('./PORT.json');

const ilcSdk = new IlcSdk();
const server = express();

if (process.env.NODE_ENV === 'development') {
    const webpack = require('webpack');
    const webpackMiddleware = require('webpack-dev-middleware');

    server.use(
        webpackMiddleware(webpack(require('./webpack.dev')), {
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
    const appSdk = new IlcAppSdk(ilcReqData);


    let links;
    try {
        links = require(`./src/links/${appSdk.intl.get().locale}.json`);
    } catch {
        links = require(`./src/links/${appSdk.intl.getDefault().locale}.json`);
    }

    const html = ReactDOMServer.renderToString(App(appSdk, ilcReqData.getCurrentReqOriginalUri(), links));

    res.send(`<script type="application/messages">${JSON.stringify(links)}</script><div class="app-container">${html}</div>`);
});

server.listen(PORT, () => {
    console.log(`Navbar server started at port ${PORT}`);
});
