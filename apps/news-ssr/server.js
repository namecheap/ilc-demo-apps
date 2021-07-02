'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const {createBundleRenderer} = require('vue-server-renderer');
const bundle = require('./dist/vue-ssr-server-bundle.json');
const clientManifestSpa = require('./dist/vue-ssr-client-manifest-spa.json');
const PORT = require('./PORT.json');

const server = express();
server.use(require('cors')());


const renderer = createBundleRenderer(bundle, {
    template: fs.readFileSync('./src/index.template.html', 'utf-8'),
    clientManifest: clientManifestSpa,
    runInNewContext: false,
    inject: false
});

const IlcSdk = require('ilc-sdk').default;
const ilcSdk = new IlcSdk();
const appAssets = {
    spaBundle: `/${clientManifestSpa.all.find(v => v.endsWith('.js'))}`,
    cssBundle: `/${clientManifestSpa.all.find(v => v.endsWith('.css'))}`,
};

server.use(express.static('dist'));

//TODO: this should be available only in dev mode
server.get('/_spa/dev/assets-discovery', (req, res) => ilcSdk.assetsDiscoveryHandler(req, res, appAssets));

server.get('*', (req, res) => {
    res.setHeader("Content-Type", "text/html");

    const ilcData = ilcSdk.processRequest(req);

    const context = {
        url: ilcData.getCurrentReqOriginalUri(), //TODO: correct base path handling
        appId: ilcData.appId,
    };

    renderer.renderToString(context, (err, html) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal server error');
        } else {
            ilcSdk.processResponse(ilcData, res, {
                pageTitle: context.meta.inject().title.text(),
                pageMetaTags: context.meta.inject().meta.text(),
                appAssets,
            });
            res.status(context.statusCode);
            if (context.url.includes('overrideErrorPage')) {
                res.header('X-ILC-Override', 'error-page-content');
            }
            res.send(html);
        }
    });

});

server.listen(PORT, () => {
    console.log(`News server started at port ${PORT}`)
});