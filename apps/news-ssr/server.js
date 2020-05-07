'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const {createBundleRenderer} = require('vue-server-renderer');
const bundle = require('./dist/vue-ssr-server-bundle.json');
const clientManifestSpa = require('./dist/vue-ssr-client-manifest-spa.json');
const template = fs.readFileSync('./src/index.template.html', 'utf-8');
const templateFragment = fs.readFileSync('./src/index.fragment.template.html', 'utf-8');
const cors = require('cors');
const PORT = 8239;

const server = express();

server.use(cors());


const renderer = createBundleRenderer(bundle, {
    template: templateFragment,
    clientManifest: clientManifestSpa,
    runInNewContext: false,
    inject: false
});

const IlcSdk = require('ilc-server-sdk').default;
const ilcSdk = new IlcSdk({ publicPath: clientManifestSpa.publicPath });
const appAssets = {
    spaBundle: clientManifestSpa.all.find(v => v.endsWith('.js')),
    cssBundle: clientManifestSpa.all.find(v => v.endsWith('.css'))
};

server.use('/dist', express.static(path.resolve(__dirname, './dist')));
server.use('/manifest.json', express.static(path.resolve(__dirname, './manifest.json')));

//TODO: this should be available only in dev mode
server.get('/_spa/dev/assets-discovery', (req, res) => ilcSdk.assetsDiscoveryHandler(req, res, appAssets));

server.get('*', (req, res) => {
    res.setHeader("Content-Type", "text/html");

    const ilcData = ilcSdk.processRequest(req);

    const context = {
        url: ilcData.getCurrentBasePath() + ilcData.getCurrentReqUrl(), //TODO: correct base path handling
        fragmentName: ilcData.getCurrentPathProps().fragmentName,
    };

    renderer.renderToString(context, (err, html) => {
        if (err) {
            if (err.code === 404) {
                res.status(400).send('Not found');
            } else {
                console.log(err);
                res.status(500).send('Internal server error');
            }
        } else {
            if (req.query.fragment !== undefined && typeof context.renderStyles === 'function') {
                ilcSdk.processResponse(ilcData, res, {
                    pageTitle: context.meta.inject().title.text(),
                    pageMetaTags: context.meta.inject().meta.text(),
                    appAssets,
                });
            }
            res.send(html);
        }
    });

});

const port = PORT || 8239;

server.listen(port, () => {
    console.log("Server started")
});