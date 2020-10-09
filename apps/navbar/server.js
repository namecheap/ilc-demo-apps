'use strict';

const express = require('express');
const cors = require('cors');

const IlcSdk = require('ilc-server-sdk').default;
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const {default: App} = require('./build/server');
const PORT = 8235;

const ilcSdk = new IlcSdk();
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

    let links;
    try {
        links = require(`./src/links/${ilcReqData.intl.get().locale}.json`);
    } catch {
        links = require(`./src/links/${ilcReqData.intl.getDefault().locale}.json`);
    }

    const html = ReactDOMServer.renderToString(App(ilcReqData, ilcReqData.getCurrentReqOriginalUri(), links));

    res.send(`<script type="application/messages">${JSON.stringify(links)}</script><div class="app-container">${html}</div>`);
});

const port = PORT || 3000;

server.listen(port, () => {
    console.log(`Navbar server started at port ${port}`);
});
