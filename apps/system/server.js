const fs = require('fs');
const express = require('express');
const cors = require('cors');
const IlcSdk = require('ilc-sdk').default;

const app = express();
const port = 8240;

const ilcSdk = new IlcSdk();

const template = require('lodash.template');
const pageTpl = template(fs.readFileSync(__dirname + '/tpl.ejs'));


if (process.env.NODE_ENV === 'development') {
    const webpack = require('webpack');
    const webpackMiddleware = require('webpack-dev-middleware');

    app.use(
        webpackMiddleware(webpack(require('./webpack.dev')), {
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            logLevel: 'debug',
        })
    );
} else {
    app.use(cors());
    app.use(express.static('build'));
}


app.get('/fragment', (req, res) => {
    const reqData = ilcSdk.processRequest(req);

    res.send(`<div data-ssr-content="true">${pageTpl({getCurrentPathProps: () => reqData.getCurrentPathProps()})}</div>`);
});

app.listen(port, () => console.log(`System app listening on port ${port}!`));
